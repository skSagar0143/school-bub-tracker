package com.bus.modules.menu.controller;

import java.util.Set;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bus.modules.menu.dto.CurrentUserMenuResponse;
import com.bus.modules.menu.service.MenuService;
import com.bus.modules.user.entity.UserRole;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/menu")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Menus", description = "Role-based navigation menus")
public class MenuController {
    private final MenuService menuService;

    @GetMapping("/me")
    public CurrentUserMenuResponse getMyMenus(Authentication authentication) {
        Set<String> authorities = authentication.getAuthorities().stream()
                .map(authority -> authority.getAuthority())
                .collect(java.util.stream.Collectors.toSet());

        UserRole role = java.util.Arrays.stream(UserRole.values())
                .filter(candidate -> authorities.contains("ROLE_" + candidate.name()))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException("No supported role found for current user."));

        return menuService.getMenusFor(role);
    }
}
