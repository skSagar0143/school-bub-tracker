package com.bus.modules.school.infrastructure.persistence.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.school.infrastructure.persistence.entity.SchoolJpaEntity;

public interface SpringDataSchoolRepository extends JpaRepository<SchoolJpaEntity, Long> {

    boolean existsByCode(String code);
}
