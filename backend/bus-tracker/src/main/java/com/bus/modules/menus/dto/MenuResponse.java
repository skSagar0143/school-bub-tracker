package com.bus.modules.menus.dto;

import java.util.List;

public record MenuResponse(Long id, String name, String path, String icon, Long sequences,
		List<MenuResponse> subMenus) {
}