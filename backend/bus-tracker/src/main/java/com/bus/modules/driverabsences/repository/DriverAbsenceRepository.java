package com.bus.modules.driverabsences.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.bus.modules.driverabsences.entity.DriverAbsenceEntity;

public interface DriverAbsenceRepository extends JpaRepository<DriverAbsenceEntity, Long> {

    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
        FROM DriverAbsenceEntity a
        WHERE a.driverId = :driverId
          AND a.status = 'ACTIVE'
          AND a.startDate <= :endDate
          AND a.endDate >= :startDate
        """)
    boolean existsOverlappingAbsence(
        @Param("driverId") Long driverId,
        @Param("startDate") LocalDate startDate,
        @Param("endDate") LocalDate endDate
    );

    List<DriverAbsenceEntity> findByDriverIdOrderByStartDateDesc(Long driverId);

    Optional<DriverAbsenceEntity> findFirstBySchoolIdAndDriverIdAndStatusAndStartDateLessThanEqualAndEndDateGreaterThanEqual(
        Long schoolId, Long driverId, String status, LocalDate tripDate, LocalDate tripDateAgain);
}
