import { Navigate, Route, Routes } from 'react-router-dom'
import type { LoginUser, Menu } from '../pages/LegacyPages'
import {
  SchoolPage, StudentsPage, BusesPage, DriversPage, RoutesPage, RouteStopsPage,
  BusAssignmentsPage, DriverAssignmentsPage, StudentTransportAssignmentsPage,
  DriversDashboard, DashboardPage,
} from '../pages/LegacyPages'

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
    <Route path="/driver-assignments" element={<DriverAssignmentsPage {...shared} />} />
    <Route path="/driver-assignment" element={<DriverAssignmentsPage {...shared} />} />
    <Route path="/student-transport-assignments" element={<StudentTransportAssignmentsPage {...shared} />} />
    <Route path="/student-transport-assignment" element={<StudentTransportAssignmentsPage {...shared} />} />
    <Route path="/drivers/dashboard" element={<DriversDashboard token={token} />} />
    <Route path="*" element={<DashboardPage user={user} path={currentPath} token={token} menus={menus} navigate={navigate} />} />
  </Routes>
}
