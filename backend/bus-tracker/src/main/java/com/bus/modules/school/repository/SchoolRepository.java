package com.bus.modules.school.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.school.entity.School;

public interface SchoolRepository extends JpaRepository<School, Long> {
    boolean existsByCodeIgnoreCase(String code);
    Optional<School> findByCodeIgnoreCase(String code);
}
