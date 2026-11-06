package com.bus.modules.menu.entity;

import java.util.HashSet;
import java.util.Set;

import com.bus.modules.user.entity.UserRole;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "menus", uniqueConstraints = @UniqueConstraint(name = "uk_menus_code", columnNames = "code"))
@Getter
@Setter
@NoArgsConstructor
public class Menu {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 80)
    private String code;

    @Column(nullable = false, length = 100)
    private String title;

    @Column(length = 160)
    private String path;

    @Column(length = 60)
    private String icon;

    @Column(nullable = false)
    private int sortOrder;

    @Column(nullable = false)
    private boolean active = true;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_id")
    private Menu parent;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "menu_roles", joinColumns = @JoinColumn(name = "menu_id"))
    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false, length = 30)
    private Set<UserRole> roles = new HashSet<>();
}
