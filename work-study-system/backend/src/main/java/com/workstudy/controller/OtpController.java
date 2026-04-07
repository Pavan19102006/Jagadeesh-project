package com.workstudy.controller;

import com.workstudy.dto.OtpRequest;
import com.workstudy.dto.OtpVerifyRequest;
import com.workstudy.entity.OtpToken;
import com.workstudy.service.OtpService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/otp")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class OtpController {

    private final OtpService otpService;

    @PostMapping("/send")
    public ResponseEntity<?> sendOtp(@Valid @RequestBody OtpRequest request) {
        try {
            OtpToken.Purpose purpose = OtpToken.Purpose.valueOf(request.getPurpose().toUpperCase());
            otpService.sendOtp(request.getEmail(), purpose);
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully to " + request.getEmail()));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid purpose. Use REGISTRATION or LOGIN"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "Failed to send OTP: " + e.getMessage()));
        }
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyOtp(@Valid @RequestBody OtpVerifyRequest request) {
        try {
            OtpToken.Purpose purpose = OtpToken.Purpose.valueOf(request.getPurpose().toUpperCase());
            boolean verified = otpService.verifyOtp(request.getEmail(), request.getOtpCode(), purpose);
            if (verified) {
                return ResponseEntity.ok(Map.of("message", "OTP verified successfully", "verified", true));
            } else {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP", "verified", false));
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid purpose"));
        }
    }
}
