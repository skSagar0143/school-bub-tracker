package com.bus.modules.user.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import com.bus.modules.user.dto.GenerateLoginAccountsRequest;
import com.bus.modules.user.dto.GeneratedLoginCredentialResponse;
import com.bus.modules.user.service.LoginAccountProvisioningService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/user/login-accounts")
@RequiredArgsConstructor
@PreAuthorize("hasRole('SCHOOL_ADMIN')")
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Login Management", description = "Generate login credentials for selected students and drivers")
public class LoginManagementController {
    private final LoginAccountProvisioningService provisioningService;

    @PostMapping("/generate")
    @ResponseStatus(HttpStatus.CREATED)
    @Operation(summary = "Generate Login IDs and one-time six-digit passwords for selected students and drivers")
    public List<GeneratedLoginCredentialResponse> generate(
            @Valid @RequestBody GenerateLoginAccountsRequest request) {
        return provisioningService.generateAccounts(request);
    }
}
