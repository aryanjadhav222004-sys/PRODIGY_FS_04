import { useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, useLocation } from 'react-router-dom'
import { selectIsAuthenticated, selectAccessToken, fetchMe } from '../store/slices/authSlice'
import { fetchRooms } from '../store/slices/roomsSlice'
import { fetchFriends } from '../store/slices/usersSlice'
import { useSocket } from '../socket/socket'

export const useAuth = () => {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const location = useLocation()
  const isAuthenticated = useSelector(selectIsAuthenticated)
  const accessToken = useSelector(selectAccessToken)

  useEffect(() => {
    const initAuth = async () => {
      if (accessToken && !isAuthenticated) {
        try {
          await dispatch(fetchMe()).unwrap()
          dispatch(fetchRooms())
          dispatch(fetchFriends())
        } catch (error) {
          navigate('/login', { state: { from: location.pathname } })
        }
      }
    }
    initAuth()
  }, [accessToken, isAuthenticated, dispatch, navigate, location])

  return { isAuthenticated, accessToken }
}

export const useRequireAuth = () => {
  const { isAuthenticated } = useAuth()
  return isAuthenticated
}

export const useRedirectIfAuthenticated = () => {
  const { isAuthenticated } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/')
    }
  }, [isAuthenticated, navigate])
}