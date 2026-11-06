package com.bus.modules.menus.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.menus.dto.CurrentUserMenuResponse;
import com.bus.modules.menus.dto.MenuResponse;
import com.bus.modules.menus.entity.MenusEntity;
import com.bus.modules.menus.entity.MenusFor;
import com.bus.modules.menus.repository.MenusRepository;
import com.bus.modules.user.entity.UserRole;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MenuServiceImpl implements MenuService {

	private final MenusRepository menusRepository;

	@Override
	public CurrentUserMenuResponse getMenusFor(UserRole role) {

		MenusFor menusFor = mapRole(role);

		List<MenusEntity> allowedMenus = menusRepository.findAllByActiveTrueAndMenusForOrderBySequencesAsc(menusFor);

		List<MenuResponse> menus = allowedMenus.stream().filter(menu -> menu.getParentMenu() == null)
				.map(menu -> convertToResponse(menu, allowedMenus)).toList();

		return new CurrentUserMenuResponse(role, findDefaultPath(menus), menus);
	}

	private MenusFor mapRole(UserRole role) {

		return switch (role) {
		case SCHOOL_ADMIN -> MenusFor.ADMIN;
		case DRIVER -> MenusFor.DRIVERS;
		case STUDENT -> MenusFor.STUDENTS;
		case PARENT -> MenusFor.PARENTS;
		};
	}

	private MenuResponse convertToResponse(MenusEntity menu, List<MenusEntity> allowedMenus) {

		List<MenuResponse> subMenus = allowedMenus.stream()
				.filter(child -> child.getParentMenu() != null && child.getParentMenu().getId().equals(menu.getId()))
				.map(child -> convertToResponse(child, allowedMenus)).toList();

		return new MenuResponse(menu.getId(), menu.getName(), menu.getPath(), menu.getIcon(), menu.getSequences(),
				subMenus);
	}

	private String findDefaultPath(List<MenuResponse> menus) {

		for (MenuResponse menu : menus) {

			if (menu.path() != null && !menu.path().isBlank()) {
				return menu.path();
			}

			String childPath = findDefaultPath(menu.subMenus());

			if (childPath != null) {
				return childPath;
			}
		}

		return "/";
	}
}