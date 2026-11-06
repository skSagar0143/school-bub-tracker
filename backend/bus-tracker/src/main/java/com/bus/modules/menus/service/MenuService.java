package com.bus.modules.menus.service;

import com.bus.modules.menus.dto.CurrentUserMenuResponse;
import com.bus.modules.user.entity.UserRole;

public interface MenuService {

	CurrentUserMenuResponse getMenusFor(UserRole role);
}