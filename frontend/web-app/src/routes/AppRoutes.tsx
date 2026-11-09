import { Route, Routes } from 'react-router-dom'
import type { LoginUser, Menu } from '../pages/LegacyPages'
import { SchoolPage } from '../features/school/SchoolPage'
import { StudentsPage } from '../features/students/StudentsPage'
import { BusesPage } from '../features/buses/BusesPage'
import { DriversPage } from '../features/drivers/DriversPage'
import { DriversDashboard } from '../features/drivers/DriversDashboard'
import { RoutesPage } from '../features/routes/RoutesPage'
import { RouteStopsPage } from '../features/route-stops/RouteStopsPage'
import { BusAssignmentsPage } from '../features/bus-assignments/BusAssignmentsPage'
import { BusAssignmentStopsPage } from '../features/bus-assignment-stops/BusAssignmentStopsPage'
import { DriverAssignmentsPage } from '../features/driver-assignments/DriverAssignmentsPage'
import { StudentTransportAssignmentsPage } from '../features/student-transport-assignments/StudentTransportAssignmentsPage'
import { TripSchedulesPage } from '../features/trip-schedules/TripSchedulesPage'
import { TripsPage } from '../features/trips/TripsPage'
import { DashboardPage } from '../features/dashboard/DashboardPage'

type Props = {
  token: string
  user: LoginUser
  menus: Menu[]
  currentPath: string
  navigate: (path: string) => void
  setError: (value: string) => void
  setNotice: (value: string) => void
}

export default function AppRoutes({ token, user, menus, currentPath, navigate, setError, setNotice }: Props) {
  const shared = { token, setError, setNotice }
  return <Routes>
    <Route path="/school" element={<SchoolPage {...shared} />} />
    <Route path="/students" element={<StudentsPage {...shared} />} />
    <Route path="/stu" element={<StudentsPage {...shared} />} />
    <Route path="/bus" element={<BusesPage {...shared} />} />
    <Route path="/busses" element={<BusesPage {...shared} />} />
    <Route path="/buses" element={<BusesPage {...shared} />} />
    <Route path="/drivers" element={<DriversPage {...shared} />} />
    <Route path="/routes" element={<RoutesPage {...shared} />} />
    <Route path="/route" element={<RoutesPage {...shared} />} />
    <Route path="/route-stops" element={<RouteStopsPage {...shared} />} />
    <Route path="/route-stop" element={<RouteStopsPage {...shared} />} />
    <Route path="/routestops" element={<RouteStopsPage {...shared} />} />
    <Route path="/route-assignments" element={<BusAssignmentsPage {...shared} />} />
    <Route path="/route-assignment" element={<BusAssignmentsPage {...shared} />} />
    <Route path="/bus-assignments" element={<BusAssignmentsPage {...shared} />} />
    <Route path="/bus-assignment" element={<BusAssignmentsPage {...shared} />} />
    <Route path="/bus-assignment-stops" element={<BusAssignmentStopsPage {...shared} />} />
    <Route path="/driver-assignments" element={<DriverAssignmentsPage {...shared} />} />
    <Route path="/driver-assignment" element={<DriverAssignmentsPage {...shared} />} />
    <Route path="/student-transport-assignments" element={<StudentTransportAssignmentsPage {...shared} />} />
    <Route path="/student-transport-assignment" element={<StudentTransportAssignmentsPage {...shared} />} />
    <Route path="/trip-schedules" element={<TripSchedulesPage {...shared} />} />
    <Route path="/trips" element={<TripsPage {...shared} />} />
    <Route path="/drivers/dashboard" element={<DriversDashboard token={token} setError={setError} />} />
    <Route path="*" element={<DashboardPage user={user} path={currentPath} token={token} menus={menus} navigate={navigate} setError={setError} />} />
  </Routes>
}
