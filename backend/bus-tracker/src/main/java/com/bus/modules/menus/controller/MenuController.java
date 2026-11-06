package com.bus.modules.menus.controller;

import java.util.Arrays;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.bus.modules.menus.dto.CurrentUserMenuResponse;
import com.bus.modules.menus.service.MenuService;
import com.bus.modules.user.entity.UserRole;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/menu")
@RequiredArgsConstructor
public class MenuController {

	private final MenuService menuService;

	@GetMapping("/me")
	public CurrentUserMenuResponse getMyMenus(Authentication authentication) {

		Set<String> authorities = authentication.getAuthorities().stream().map(authority -> authority.getAuthority())
				.collect(Collectors.toSet());

		UserRole role = Arrays.stream(UserRole.values())
				.filter(candidate -> authorities.contains("ROLE_" + candidate.name())).findFirst()
				.orElseThrow(() -> new IllegalStateException("No supported role found."));

		return menuService.getMenusFor(role);
	}
}