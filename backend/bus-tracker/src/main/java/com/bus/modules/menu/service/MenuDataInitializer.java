package com.bus.modules.menu.service;

import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.bus.modules.menu.entity.Menu;
import com.bus.modules.menu.repository.MenuRepository;
import com.bus.modules.user.entity.UserRole;

import lombok.RequiredArgsConstructor;

@Component
@RequiredArgsConstructor
public class MenuDataInitializer implements CommandLineRunner {
    private final MenuRepository menuRepository;

    @Override
    @Transactional
    public void run(String... args) {
        seed("ADMIN_DASHBOARD", "Dashboard", "/dashboard", "layout-dashboard", 1,
                Set.of(UserRole.SCHOOL_ADMIN), null);
        seed("ADMIN_SCHOOL", "School", "/school", "school", 2,
                Set.of(UserRole.SCHOOL_ADMIN), null);

        Menu drivers = seed("ADMIN_DRIVERS", "Drivers", null, "steering-wheel", 3,
                Set.of(UserRole.SCHOOL_ADMIN), null);
        seed("ADMIN_DRIVERS_DASHBOARD", "Dashboard", "/drivers/dashboard", "layout-dashboard", 1,
                Set.of(UserRole.SCHOOL_ADMIN), drivers);
        seed("ADMIN_DRIVERS_ALL", "All Drivers", "/drivers", "users", 2,
                Set.of(UserRole.SCHOOL_ADMIN), drivers);

        seed("DRIVER_DASHBOARD", "Dashboard", "/driver/dashboard", "layout-dashboard", 1,
                Set.of(UserRole.DRIVER), null);
        seed("DRIVER_TRIPS", "My Trips", "/driver/trips", "route", 2,
                Set.of(UserRole.DRIVER), null);

        seed("FAMILY_DASHBOARD", "Dashboard", "/parent/dashboard", "layout-dashboard", 1,
                Set.of(UserRole.STUDENT, UserRole.PARENT), null);
        seed("FAMILY_TRACKING", "Bus Tracking", "/parent/bus-tracking", "map-pinned", 2,
                Set.of(UserRole.STUDENT, UserRole.PARENT), null);
        seed("FAMILY_NOTIFICATIONS", "Notifications", "/parent/notifications", "bell", 3,
                Set.of(UserRole.STUDENT, UserRole.PARENT), null);
    }

    private Menu seed(String code, String title, String path, String icon, int order,
            Set<UserRole> roles, Menu parent) {
        Menu menu = menuRepository.findAll().stream()
                .filter(existing -> existing.getCode().equals(code))
                .findFirst().orElseGet(Menu::new);
        menu.setCode(code);
        menu.setTitle(title);
        menu.setPath(path);
        menu.setIcon(icon);
        menu.setSortOrder(order);
        menu.setActive(true);
        menu.setRoles(roles);
        menu.setParent(parent);
        return menuRepository.save(menu);
    }
}
