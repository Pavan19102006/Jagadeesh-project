package com.workstudy.controller;

import com.workstudy.dto.GoogleAuthRequest;
import com.workstudy.dto.LoginRequest;
import com.workstudy.dto.LoginResponse;
import com.workstudy.dto.RegisterRequest;
import com.workstudy.entity.OtpToken;
import com.workstudy.entity.User;
import com.workstudy.security.JwtUtil;
import com.workstudy.service.CaptchaService;
import com.workstudy.service.OtpService;
import com.workstudy.service.UserService;
import com.workstudy.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.Map;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import org.springframework.beans.factory.annotation.Value;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
@Slf4j
public class AuthController {
    private final AuthenticationManager authenticationManager;
    private final UserService userService;
    private final JwtUtil jwtUtil;
    private final CaptchaService captchaService;
    private final OtpService otpService;
    private final UserRepository userRepository;

    @Value("${google.client.id:}")
    private String googleClientId;

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        String mode = request.getLoginMode() != null ? request.getLoginMode().toUpperCase() : "PASSWORD";

        if ("OTP".equals(mode)) {
            return handleOtpLogin(request);
        } else {
            return handlePasswordLogin(request);
        }
    }

    private ResponseEntity<?> handlePasswordLogin(LoginRequest request) {
        // Validate required fields
        if (request.getUsername() == null || request.getUsername().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username is required"));
        }
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Password is required"));
        }

        // Validate CAPTCHA
        if (request.getCaptchaId() == null || request.getCaptchaAnswer() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "CAPTCHA is required"));
        }
        if (!captchaService.validateCaptcha(request.getCaptchaId(), request.getCaptchaAnswer())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid CAPTCHA answer. Please try again."));
        }

        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);
            User user = userService.findByUsername(request.getUsername());
            String token = jwtUtil.generateToken(user);

            return ResponseEntity.ok(new LoginResponse(token, user));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid username or password"));
        }
    }

    private ResponseEntity<?> handleOtpLogin(LoginRequest request) {
        // Validate required fields
        if (request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email is required for OTP login"));
        }
        if (request.getOtpCode() == null || request.getOtpCode().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "OTP code is required"));
        }

        // Verify the OTP
        boolean verified = otpService.verifyOtp(request.getEmail(), request.getOtpCode(), OtpToken.Purpose.LOGIN);
        if (!verified) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP"));
        }

        // Find user by email
        var userOpt = userRepository.findByEmail(request.getEmail());
        if (userOpt.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No account found with this email"));
        }

        User user = userOpt.get();
        String token = jwtUtil.generateToken(user);

        return ResponseEntity.ok(new LoginResponse(token, user));
    }

    @PostMapping("/register/student")
    public ResponseEntity<?> registerStudent(@RequestBody RegisterRequest request) {
        return handleRegistration(request, false);
    }

    @PostMapping("/register/admin")
    public ResponseEntity<?> registerAdmin(@RequestBody RegisterRequest request) {
        return handleRegistration(request, true);
    }

    private ResponseEntity<?> handleRegistration(RegisterRequest request, boolean isAdmin) {
        // Validate OTP first
        if (request.getOtpCode() == null || request.getOtpCode().isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Email OTP verification is required"));
        }

        boolean otpValid = otpService.verifyOtp(
                request.getEmail(), request.getOtpCode(), OtpToken.Purpose.REGISTRATION);
        if (!otpValid) {
            return ResponseEntity.badRequest().body(Map.of("error", "Invalid or expired OTP. Please request a new one."));
        }

        try {
            User user;
            if (isAdmin) {
                user = userService.createAdmin(request);
            } else {
                user = userService.createStudent(request);
            }
            String token = jwtUtil.generateToken(user);
            return ResponseEntity.ok(new LoginResponse(token, user));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(Authentication authentication) {
        User user = userService.findByUsername(authentication.getName());
        return ResponseEntity.ok(user);
    }

    @PostMapping("/google")
    public ResponseEntity<?> googleLogin(@RequestBody GoogleAuthRequest request) {
        try {
            if (googleClientId == null || googleClientId.isBlank()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Google OAuth is not configured on the server"));
            }

            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                    new NetHttpTransport(), GsonFactory.getDefaultInstance())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(request.getIdToken());
            if (idToken == null) {
                return ResponseEntity.badRequest().body(Map.of("error", "Invalid Google token"));
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail();
            String name = (String) payload.get("name");
            if (name == null || name.isBlank()) name = email.split("@")[0];

            // Find or create user
            var userOpt = userRepository.findByEmail(email);
            User user;
            if (userOpt.isPresent()) {
                user = userOpt.get();
            } else {
                // Auto-register as student
                user = new User();
                user.setEmail(email);
                user.setFullName(name);
                // Use email prefix as username, ensure uniqueness
                String baseUsername = email.split("@")[0].replaceAll("[^a-zA-Z0-9]", "");
                String username = baseUsername;
                int counter = 1;
                while (userRepository.existsByUsername(username)) {
                    username = baseUsername + counter++;
                }
                user.setUsername(username);
                user.setPassword(org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder.class.getName()); // placeholder
                user.setRole(User.Role.STUDENT);
                user.setActive(true);
                // encode a random password since Google users don't use password login
                user.setPassword(new org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder()
                        .encode(java.util.UUID.randomUUID().toString()));
                user = userRepository.save(user);
                log.info("Created new Google user: {} ({})", username, email);
            }

            String token = jwtUtil.generateToken(user);
            return ResponseEntity.ok(new LoginResponse(token, user));
        } catch (Exception e) {
            log.error("Google auth failed", e);
            return ResponseEntity.badRequest().body(Map.of("error", "Google authentication failed: " + e.getMessage()));
        }
    }
}
