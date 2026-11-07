package com.bus.modules.drivers.services;

import java.util.List;

import com.bus.modules.drivers.entity.DriversEntity;

public interface DriversService {

	DriversEntity createDriver(DriversEntity driver);

	DriversEntity updateDriver(Long id, DriversEntity driver);

	DriversEntity getDriverById(Long id);

	List<DriversEntity> getAllDrivers();

	List<DriversEntity> getDriversBySchoolId(Long schoolId);

	void deleteDriver(Long id);
}