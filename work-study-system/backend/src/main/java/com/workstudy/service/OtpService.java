package com.workstudy.service;

import com.workstudy.entity.OtpToken;
import com.workstudy.repository.OtpTokenRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class OtpService {

    private final OtpTokenRepository otpTokenRepository;
    private final EmailService emailService;
    private static final int OTP_LENGTH = 6;
    private static final int OTP_EXPIRY_MINUTES = 5;

    /**
     * Generate and send an OTP to the given email address.
     */
    @Transactional
    public void sendOtp(String email, OtpToken.Purpose purpose) {
        // Delete any previous OTPs for this email + purpose
        otpTokenRepository.deleteByEmailAndPurpose(email, purpose);

        // Generate a 6-digit OTP
        String otpCode = generateOtpCode();

        // Save to database
        OtpToken token = new OtpToken();
        token.setEmail(email);
        token.setOtpCode(otpCode);
        token.setPurpose(purpose);
        token.setVerified(false);
        token.setExpiresAt(LocalDateTime.now().plusMinutes(OTP_EXPIRY_MINUTES));
        otpTokenRepository.save(token);

        // Send email
        emailService.sendOtpEmail(email, otpCode, purpose.name());

        // Also log to console for development convenience
        log.info("OTP generated for {} ({}): {}", email, purpose, otpCode);
    }

    /**
     * Verify the OTP code for a given email and purpose.
     */
    @Transactional
    public boolean verifyOtp(String email, String otpCode, OtpToken.Purpose purpose) {
        var tokenOpt = otpTokenRepository
                .findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(email, purpose);

        if (tokenOpt.isEmpty()) {
            log.warn("No OTP found for email={} purpose={}", email, purpose);
            return false;
        }

        OtpToken token = tokenOpt.get();

        if (token.isExpired()) {
            log.warn("OTP expired for email={}", email);
            return false;
        }

        if (!token.getOtpCode().equals(otpCode)) {
            log.warn("OTP mismatch for email={}", email);
            return false;
        }

        // Mark as verified
        token.setVerified(true);
        otpTokenRepository.save(token);
        return true;
    }

    /**
     * Check if an OTP has been verified for the given email and purpose.
     */
    public boolean isOtpVerified(String email, OtpToken.Purpose purpose) {
        var tokenOpt = otpTokenRepository
                .findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(email, purpose);
        // If no unverified token exists, check if any verified token exists
        // We actually want to check the latest token for this email+purpose
        return otpTokenRepository
                .findTopByEmailAndPurposeAndVerifiedFalseOrderByCreatedAtDesc(email, purpose)
                .isEmpty(); // If empty, it means the token was verified (or none exists)
    }

    private String generateOtpCode() {
        SecureRandom random = new SecureRandom();
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < OTP_LENGTH; i++) {
            otp.append(random.nextInt(10));
        }
        return otp.toString();
    }

    /**
     * Cleanup expired tokens (can be called periodically).
     */
    @Transactional
    public void cleanupExpired() {
        otpTokenRepository.deleteExpiredTokens(LocalDateTime.now());
    }
}
