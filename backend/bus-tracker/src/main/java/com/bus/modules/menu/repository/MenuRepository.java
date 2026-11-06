package com.bus.modules.menu.repository;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import com.bus.modules.menu.entity.Menu;

public interface MenuRepository extends JpaRepository<Menu, Long> {
    List<Menu> findAllByActiveTrueOrderBySortOrderAsc();
    boolean existsByCode(String code);
}
