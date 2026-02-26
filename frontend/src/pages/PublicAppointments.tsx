import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { HiBell, HiCheck, HiCalendar, HiUser, HiPhone, HiMail, HiLocationMarker } from 'react-icons/hi';
import api from '../services/api';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string;
  appointmentDate: string;
  notes: string | null;
  isViewed: boolean;
  isNotified: boolean;
  createdAt: string;
  branch: {
    id: string;
    name: string;
  } | null;
}

export default function PublicAppointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAppointments();
    fetchUnreadCount();
  }, []);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      // Filtrar solo citas del formulario web
      const webAppointments = response.data.data.filter(
        (app: Appointment) => !app.isViewed
      );
      setAppointments(webAppointments);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/appointments/notifications/unread');
      setUnreadCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsViewed = async (id: string) => {
    try {
      await api.put(`/appointments/${id}/view`);
      setAppointments(prev => prev.filter(app => app.id !== id));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking as viewed:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-DO', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header con badge de notificaciones */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <HiBell className="h-8 w-8 text-blue-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                {unreadCount}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Citas de Clientes</h1>
            <p className="text-gray-600">
              {unreadCount > 0 
                ? `Tienes ${unreadCount} citas nuevas por revisar`
                : 'No hay citas nuevas'
              }
            </p>
          </div>
        </div>
        <button
          onClick={fetchAppointments}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Lista de citas */}
      {appointments.length === 0 ? (
        <div className="bg-gray-50 rounded-lg p-8 text-center">
          <HiCalendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay citas nuevas</h3>
          <p className="text-gray-600">
            Las citas agendadas por clientes desde el formulario web aparecerán aquí.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {appointments.map((appointment) => (
            <div
              key={appointment.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Badge de nueva */}
                  {!appointment.isViewed && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 mb-3">
                      <HiBell className="h-3 w-3 mr-1" />
                      Nueva
                    </span>
                  )}

                  {/* Información del cliente */}
                  <div className="space-y-2">
                    <div className="flex items-center text-gray-900">
                      <HiUser className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="font-semibold text-lg">{appointment.clientName}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <HiPhone className="h-5 w-5 text-gray-400 mr-2" />
                      <span>{appointment.clientPhone}</span>
                    </div>

                    {appointment.clientEmail && (
                      <div className="flex items-center text-gray-600">
                        <HiMail className="h-5 w-5 text-gray-400 mr-2" />
                        <span>{appointment.clientEmail}</span>
                      </div>
                    )}

                    <div className="flex items-center text-blue-600 font-medium">
                      <HiCalendar className="h-5 w-5 mr-2" />
                      <span>{formatDate(appointment.appointmentDate)}</span>
                    </div>

                    {appointment.branch && (
                      <div className="flex items-center text-gray-600">
                        <HiLocationMarker className="h-5 w-5 text-gray-400 mr-2" />
                        <span>{appointment.branch.name}</span>
                      </div>
                    )}

                    {appointment.notes && (
                      <div className="mt-3 p-3 bg-yellow-50 rounded-lg text-sm text-gray-700">
                        <strong>Notas:</strong> {appointment.notes}
                      </div>
                    )}

                    <div className="text-xs text-gray-500 mt-2">
                      Agendada el {new Date(appointment.createdAt).toLocaleString('es-DO')}
                    </div>
                  </div>
                </div>

                {/* Acciones */}
                <div className="ml-4 flex flex-col space-y-2">
                  <button
                    onClick={() => markAsViewed(appointment.id)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    <HiCheck className="h-4 w-4 mr-1" />
                    Marcar vista
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
