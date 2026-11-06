package com.bus.modules.menu.service;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.menu.dto.CurrentUserMenuResponse;
import com.bus.modules.menu.dto.MenuResponse;
import com.bus.modules.menu.entity.Menu;
import com.bus.modules.menu.repository.MenuRepository;
import com.bus.modules.user.entity.UserRole;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuService {
    private final MenuRepository menuRepository;

    public CurrentUserMenuResponse getMenusFor(UserRole role) {
        List<Menu> allowed = menuRepository.findAllByActiveTrueOrderBySortOrderAsc().stream()
                .filter(menu -> menu.getRoles().contains(role))
                .toList();

        List<Menu> roots = allowed.stream()
                .filter(menu -> menu.getParent() == null)
                .sorted(Comparator.comparingInt(Menu::getSortOrder))
                .toList();

        List<MenuResponse> response = roots.stream()
                .map(menu -> toResponse(menu, allowed))
                .toList();

        String defaultPath = findFirstPath(response);
        return new CurrentUserMenuResponse(role, defaultPath, response);
    }

    private MenuResponse toResponse(Menu menu, List<Menu> allowed) {
        List<MenuResponse> children = allowed.stream()
                .filter(candidate -> candidate.getParent() != null
                        && candidate.getParent().getId().equals(menu.getId()))
                .sorted(Comparator.comparingInt(Menu::getSortOrder))
                .map(child -> toResponse(child, allowed))
                .toList();

        return new MenuResponse(menu.getId(), menu.getCode(), menu.getTitle(),
                menu.getPath(), menu.getIcon(), menu.getSortOrder(), children);
    }

    private String findFirstPath(List<MenuResponse> menus) {
        for (MenuResponse menu : menus) {
            if (menu.path() != null && !menu.path().isBlank()) return menu.path();
            String childPath = findFirstPath(menu.children());
            if (childPath != null) return childPath;
        }
        return "/";
    }
}
