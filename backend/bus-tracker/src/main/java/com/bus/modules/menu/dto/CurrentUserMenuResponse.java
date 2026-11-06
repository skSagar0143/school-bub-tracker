package com.bus.modules.menu.dto;

import java.util.List;
import com.bus.modules.user.entity.UserRole;

public record CurrentUserMenuResponse(
        UserRole role,
        String defaultPath,
        List<MenuResponse> menus
) {}
