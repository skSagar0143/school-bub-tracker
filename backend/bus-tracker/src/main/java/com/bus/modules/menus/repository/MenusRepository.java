package com.bus.modules.menus.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.menus.entity.MenusEntity;
import com.bus.modules.menus.entity.MenusFor;

public interface MenusRepository extends JpaRepository<MenusEntity, Long> {

	List<MenusEntity> findAllByActiveTrueAndMenusForOrderBySequencesAsc(MenusFor menusFor);
}