package com.workstudy.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@Slf4j
public class CaptchaService {

    private static final int WIDTH = 200;
    private static final int HEIGHT = 70;
    private static final long CAPTCHA_TTL_MS = 5 * 60 * 1000; // 5 minutes

    // In-memory store: captchaId -> { answer, createdAt }
    private final ConcurrentHashMap<String, CaptchaEntry> captchaStore = new ConcurrentHashMap<>();

    private static class CaptchaEntry {
        final String answer;
        final long createdAt;

        CaptchaEntry(String answer) {
            this.answer = answer;
            this.createdAt = System.currentTimeMillis();
        }

        boolean isExpired() {
            return System.currentTimeMillis() - createdAt > CAPTCHA_TTL_MS;
        }
    }

    /**
     * Generate a CAPTCHA and return its ID + Base64-encoded image.
     */
    public Map<String, String> generateCaptcha() {
        cleanupExpired();

        Random random = new Random();
        int a = random.nextInt(9) + 1; // 1-9
        int b = random.nextInt(9) + 1; // 1-9
        int operator = random.nextInt(2); // 0 = add, 1 = multiply

        String question;
        int answer;
        if (operator == 0) {
            question = a + " + " + b + " = ?";
            answer = a + b;
        } else {
            question = a + " × " + b + " = ?";
            answer = a * b;
        }

        String captchaId = UUID.randomUUID().toString();
        captchaStore.put(captchaId, new CaptchaEntry(String.valueOf(answer)));

        String imageBase64 = renderCaptchaImage(question, random);

        Map<String, String> result = new HashMap<>();
        result.put("captchaId", captchaId);
        result.put("captchaImage", "data:image/png;base64," + imageBase64);
        return result;
    }

    /**
     * Validate the user's CAPTCHA answer.
     */
    public boolean validateCaptcha(String captchaId, String userAnswer) {
        if (captchaId == null || userAnswer == null) return false;

        CaptchaEntry entry = captchaStore.remove(captchaId);
        if (entry == null || entry.isExpired()) return false;

        return entry.answer.trim().equalsIgnoreCase(userAnswer.trim());
    }

    private String renderCaptchaImage(String text, Random random) {
        BufferedImage image = new BufferedImage(WIDTH, HEIGHT, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();

        // Anti-aliasing
        g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        // Background gradient
        GradientPaint gradient = new GradientPaint(0, 0,
                new Color(20, 10, 50), WIDTH, HEIGHT, new Color(40, 20, 80));
        g.setPaint(gradient);
        g.fillRect(0, 0, WIDTH, HEIGHT);

        // Noise lines
        for (int i = 0; i < 8; i++) {
            g.setColor(new Color(
                    random.nextInt(100) + 50,
                    random.nextInt(100) + 50,
                    random.nextInt(150) + 100,
                    80));
            g.setStroke(new BasicStroke(1 + random.nextFloat()));
            g.drawLine(random.nextInt(WIDTH), random.nextInt(HEIGHT),
                    random.nextInt(WIDTH), random.nextInt(HEIGHT));
        }

        // Noise dots
        for (int i = 0; i < 60; i++) {
            g.setColor(new Color(
                    random.nextInt(200) + 55,
                    random.nextInt(200) + 55,
                    random.nextInt(200) + 55,
                    120));
            int dotSize = 1 + random.nextInt(3);
            g.fillOval(random.nextInt(WIDTH), random.nextInt(HEIGHT), dotSize, dotSize);
        }

        // Draw text with slight rotation per character
        Font font = new Font("SansSerif", Font.BOLD, 32);
        g.setFont(font);
        FontMetrics fm = g.getFontMetrics();
        int textWidth = fm.stringWidth(text);
        int startX = (WIDTH - textWidth) / 2;
        int startY = HEIGHT / 2 + fm.getAscent() / 3;

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            double angle = (random.nextDouble() - 0.5) * 0.3;
            int offsetY = random.nextInt(8) - 4;

            Graphics2D g2 = (Graphics2D) g.create();
            int x = startX + fm.stringWidth(text.substring(0, i));
            g2.translate(x, startY + offsetY);
            g2.rotate(angle);

            // Shadow
            g2.setColor(new Color(0, 0, 0, 100));
            g2.drawString(String.valueOf(c), 2, 2);

            // Main text with gradient color
            g2.setColor(new Color(
                    100 + random.nextInt(155),
                    200 + random.nextInt(55),
                    220 + random.nextInt(35)));
            g2.drawString(String.valueOf(c), 0, 0);
            g2.dispose();
        }

        g.dispose();

        try {
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "png", baos);
            return Base64.getEncoder().encodeToString(baos.toByteArray());
        } catch (Exception e) {
            log.error("Failed to generate CAPTCHA image", e);
            return "";
        }
    }

    private void cleanupExpired() {
        captchaStore.entrySet().removeIf(e -> e.getValue().isExpired());
    }
}
