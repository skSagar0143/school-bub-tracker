
package com.bus.modules.busses.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.bus.modules.busses.entity.BusEntity;

@Repository
public interface BusRepository extends JpaRepository<BusEntity, Long> {

	boolean existsBySchoolIdAndBusNumber(Long schoolId, String busNumber);

	boolean existsBySchoolIdAndBusNumberAndIdNot(Long schoolId, String busNumber, Long id);

	boolean existsByRegistrationNumber(String registrationNumber);

	boolean existsByRegistrationNumberAndIdNot(String registrationNumber, Long id);

	List<BusEntity> findByStatus(String status);

	List<BusEntity> findBySchoolIdAndStatus(Long schoolId, String status);
}
