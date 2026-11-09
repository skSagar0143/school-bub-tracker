package com.bus.modules.drivers.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

import com.bus.modules.drivers.entity.DriversEntity;

public interface DriversRepository extends JpaRepository<DriversEntity, Long> {

	boolean existsBySchoolIdAndDriverCode(Long schoolId, String driverCode);

	boolean existsBySchoolIdAndDriverCodeAndIdNot(Long schoolId, String driverCode, Long id);

	boolean existsByLicenseNumber(String licenseNumber);

	boolean existsByLicenseNumberAndIdNot(String licenseNumber, Long id);

	List<DriversEntity> findByStatus(String status);

	List<DriversEntity> findBySchoolIdAndStatus(Long schoolId, String status);

	Optional<DriversEntity> findByUserId(UUID userId);
}