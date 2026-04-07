package com.workstudy.controller;

import com.workstudy.dto.CaptchaResponse;
import com.workstudy.service.CaptchaService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/captcha")
@RequiredArgsConstructor
@CrossOrigin(origins = "*")
public class CaptchaController {

    private final CaptchaService captchaService;

    @GetMapping("/generate")
    public ResponseEntity<CaptchaResponse> generateCaptcha() {
        Map<String, String> captcha = captchaService.generateCaptcha();
        return ResponseEntity.ok(new CaptchaResponse(
                captcha.get("captchaId"),
                captcha.get("captchaImage")
        ));
    }
}
