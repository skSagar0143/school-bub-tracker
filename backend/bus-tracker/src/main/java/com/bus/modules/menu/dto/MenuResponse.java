package com.bus.modules.menu.dto;

import java.util.List;

public record MenuResponse(
        Long id,
        String code,
        String title,
        String path,
        String icon,
        int sortOrder,
        List<MenuResponse> children
) {}
