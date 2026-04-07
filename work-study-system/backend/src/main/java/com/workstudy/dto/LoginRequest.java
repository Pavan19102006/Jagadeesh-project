package com.workstudy.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String username;
    private String password;

    // Login mode: "PASSWORD" or "OTP"
    private String loginMode = "PASSWORD";

    // CAPTCHA fields (for PASSWORD mode)
    private String captchaId;
    private String captchaAnswer;

    // OTP fields (for OTP mode)
    private String email;
    private String otpCode;
}
