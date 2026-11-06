package com.bus.modules.menus.entity;

import java.util.ArrayList;
import java.util.List;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Getter
@Setter
@NoArgsConstructor
@Table(name = "menus")
public class MenusEntity {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 100)
	private String name;

	@Column(length = 160)
	private String path;

	@Enumerated(EnumType.STRING)
	@Column(nullable = false, length = 30)
	private MenusFor menusFor;

	@ManyToOne(fetch = FetchType.LAZY)
	@JoinColumn(name = "parent_menu_id")
	private MenusEntity parentMenu;

	@OneToMany(mappedBy = "parentMenu")
	@OrderBy("sequences ASC")
	private List<MenusEntity> subMenus = new ArrayList<>();

	@Column(nullable = false)
	private Long sequences;

	@Column(length = 60)
	private String icon;

	@Column(nullable = false)
	private boolean active = true;
}