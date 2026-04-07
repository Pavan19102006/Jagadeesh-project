package com.workstudy.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${spring.mail.username:noreply@workstudy.com}")
    private String fromEmail;

    public void sendOtpEmail(String toEmail, String otpCode, String purpose) {
        String subject = "REGISTRATION".equals(purpose)
                ? "Work-Study – Verify Your Email"
                : "Work-Study – Login OTP";

        String htmlContent = buildOtpEmailHtml(otpCode, purpose);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(htmlContent, true);
            mailSender.send(message);
            log.info("OTP email sent to {} for {}", toEmail, purpose);
        } catch (MessagingException e) {
            log.error("Failed to send OTP email to {}: {}", toEmail, e.getMessage());
            // Fall back to console logging so dev can still test
            log.warn(">>> FALLBACK: OTP for {} is: {} <<<", toEmail, otpCode);
        }
    }

    private String buildOtpEmailHtml(String otpCode, String purpose) {
        String title = "REGISTRATION".equals(purpose)
                ? "Verify Your Email"
                : "Your Login Code";
        String description = "REGISTRATION".equals(purpose)
                ? "Use the code below to complete your registration:"
                : "Use the code below to sign in to your account:";

        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
            </head>
            <body style="margin:0;padding:0;background-color:#0f0a1e;font-family:'Segoe UI',Arial,sans-serif;">
                <div style="max-width:480px;margin:40px auto;background:linear-gradient(135deg,#1a1035 0%%,#0d0820 100%%);border-radius:20px;border:1px solid rgba(255,255,255,0.1);overflow:hidden;">
                    <!-- Header -->
                    <div style="background:linear-gradient(135deg,#06b6d4,#3b82f6);padding:30px;text-align:center;">
                        <h1 style="margin:0;color:#ffffff;font-size:24px;font-weight:700;">%s</h1>
                    </div>
                    <!-- Body -->
                    <div style="padding:40px 30px;text-align:center;">
                        <p style="color:rgba(255,255,255,0.7);font-size:16px;margin:0 0 30px;">%s</p>
                        <!-- OTP Code -->
                        <div style="background:rgba(255,255,255,0.08);border:2px dashed rgba(6,182,212,0.5);border-radius:16px;padding:20px;margin:0 20px;">
                            <span style="font-size:36px;font-weight:800;letter-spacing:12px;color:#06b6d4;font-family:monospace;">%s</span>
                        </div>
                        <p style="color:rgba(255,255,255,0.4);font-size:13px;margin:25px 0 0;">This code expires in <strong style="color:rgba(255,255,255,0.7);">5 minutes</strong></p>
                    </div>
                    <!-- Footer -->
                    <div style="padding:20px 30px;border-top:1px solid rgba(255,255,255,0.05);text-align:center;">
                        <p style="color:rgba(255,255,255,0.3);font-size:12px;margin:0;">Work-Study Program Management System</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(title, description, otpCode);
    }
}
