
package com.bus.modules.busses.services;

import java.util.List;

import com.bus.modules.busses.entity.BusEntity;

public interface BusServices {

	BusEntity createBus(BusEntity bus);

	BusEntity updateBus(Long id, BusEntity bus);

	BusEntity getBusById(Long id);

	List<BusEntity> getAllBuses();

	List<BusEntity> getBusesBySchoolId(Long schoolId);

	void deleteBus(Long id);
}
