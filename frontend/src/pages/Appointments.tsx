import { useState, useEffect } from 'react';
import { appointmentApi } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import { useConfirm } from '../hooks/useConfirm.tsx';
import { HiCalendar, HiPlus, HiChevronLeft, HiChevronRight, HiClock, HiMapPin, HiUser, HiPhone, HiMail, HiCheck, HiX, HiQuestionMarkCircle } from 'react-icons/hi';

interface Appointment {
  id: string;
  clientName: string;
  clientEmail: string | null;
  clientPhone: string;
  appointmentDate: string;
  duration: number;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
  notes: string | null;
  source: string;
  branch: {
    id: string;
    name: string;
  } | null;
  user: {
    id: string;
    name: string;
  } | null;
}

const Appointments = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const { showToast } = useToast();
  const { showConfirm } = useConfirm();

  const [form, setForm] = useState({
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    appointmentDate: '',
    duration: 60,
    notes: '',
    branchId: '',
  });

  useEffect(() => {
    fetchAppointments();
  }, [currentDate]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const data = await appointmentApi.getAppointments({
        startDate: startOfMonth.toISOString(),
        endDate: endOfMonth.toISOString(),
      });
      setAppointments(data.data || []);
    } catch (error) {
      showToast('Error al cargar citas', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingAppointment) {
        await appointmentApi.updateAppointment(editingAppointment.id, form);
        showToast('Cita actualizada exitosamente', 'success');
      } else {
        await appointmentApi.createAppointment(form);
        showToast('Cita creada exitosamente', 'success');
      }
      setShowModal(false);
      setEditingAppointment(null);
      resetForm();
      fetchAppointments();
    } catch (error: any) {
      showToast(error.response?.data?.error?.message || 'Error al guardar cita', 'error');
    }
  };

  const handleDelete = (appointment: Appointment) => {
    showConfirm(
      'Eliminar Cita',
      `¿Estás seguro de eliminar la cita de ${appointment.clientName}?`,
      async () => {
        try {
          await appointmentApi.deleteAppointment(appointment.id);
          showToast('Cita eliminada exitosamente', 'success');
          fetchAppointments();
        } catch (error) {
          showToast('Error al eliminar cita', 'error');
        }
      }
    );
  };

  const handleStatusChange = async (appointment: Appointment, status: string) => {
    try {
      await appointmentApi.updateAppointment(appointment.id, { status });
      showToast('Estado actualizado', 'success');
      fetchAppointments();
    } catch (error) {
      showToast('Error al actualizar estado', 'error');
    }
  };

  const resetForm = () => {
    setForm({
      clientName: '',
      clientEmail: '',
      clientPhone: '',
      appointmentDate: '',
      duration: 60,
      notes: '',
      branchId: '',
    });
  };

  const openModal = (appointment?: Appointment, date?: Date) => {
    if (appointment) {
      setEditingAppointment(appointment);
      setForm({
        clientName: appointment.clientName,
        clientEmail: appointment.clientEmail || '',
        clientPhone: appointment.clientPhone,
        appointmentDate: appointment.appointmentDate.slice(0, 16),
        duration: appointment.duration,
        notes: appointment.notes || '',
        branchId: appointment.branch?.id || '',
      });
    } else {
      setEditingAppointment(null);
      resetForm();
      if (date) {
        const dateStr = date.toISOString().slice(0, 16);
        setForm(prev => ({ ...prev, appointmentDate: dateStr }));
      }
    }
    setShowModal(true);
  };

  // Generar días del mes
  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();

    const days = [];
    
    // Días vacíos antes del primer día
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    
    // Días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    
    return days;
  };

  const getAppointmentsForDay = (date: Date) => {
    return appointments.filter(apt => {
      const aptDate = new Date(apt.appointmentDate);
      return aptDate.getDate() === date.getDate() &&
             aptDate.getMonth() === date.getMonth() &&
             aptDate.getFullYear() === date.getFullYear();
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'CONFIRMED': return 'bg-blue-50 text-[#1D79C4] border-blue-200';
      case 'CANCELLED': return 'bg-red-50 text-red-700 border-red-200';
      case 'COMPLETED': return 'bg-green-50 text-green-700 border-green-200';
      default: return 'bg-gray-50 text-[#1f2937] border-gray-200';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Pendiente';
      case 'CONFIRMED': return 'Confirmada';
      case 'CANCELLED': return 'Cancelada';
      case 'COMPLETED': return 'Completada';
      default: return status;
    }
  };

  const monthNames = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

  return (
    <div className="p-4 md:p-6 space-y-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-bold text-[#000000]">Citas</h1>
          <p className="text-sm text-[#1f2937]">Gestión de citas y agenda</p>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'calendar' ? 'bg-white text-[#000000] shadow-sm' : 'text-[#1f2937] hover:text-[#000000]'
              }`}
            >
              <HiCalendar className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-2 rounded-md text-xs font-medium transition-colors ${
                viewMode === 'list' ? 'bg-white text-[#000000] shadow-sm' : 'text-[#1f2937] hover:text-[#000000]'
              }`}
            >
              Lista
            </button>
          </div>
          <button
            onClick={() => openModal()}
            className="inline-flex items-center px-4 py-2 bg-[#1D79C4] text-white rounded-lg hover:bg-[#1565b0] transition-colors text-sm"
          >
            <HiPlus className="w-5 h-5 mr-2" />
            Nueva Cita
          </button>
        </div>
      </div>

      {viewMode === 'calendar' ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* Header del calendario */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-base font-bold text-[#000000]">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <HiChevronLeft className="w-4 h-4 text-[#1f2937]" />
              </button>
              <button
                onClick={() => setCurrentDate(new Date())}
                className="px-3 py-1.5 text-xs font-medium text-[#1f2937] hover:bg-gray-50 rounded-lg transition-colors"
              >
                Hoy
              </button>
              <button
                onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))}
                className="p-2 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <HiChevronRight className="w-4 h-4 text-[#1f2937]" />
              </button>
            </div>
          </div>

          {/* Días de la semana */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-xs font-semibold text-[#1f2937]">
                {day}
              </div>
            ))}
          </div>

          {/* Días del mes */}
          <div className="grid grid-cols-7">
            {getDaysInMonth().map((date, index) => {
              if (!date) {
                return <div key={`empty-${index}`} className="min-h-[120px] bg-gray-50 border-b border-r" />;
              }

              const dayAppointments = getAppointmentsForDay(date);
              const isToday = new Date().toDateString() === date.toDateString();

              return (
                <div
                  key={date.getDate()}
                  onClick={() => openModal(undefined, date)}
                  className={`min-h-[120px] border-b border-r border-gray-200 p-2 cursor-pointer hover:bg-gray-50 transition-colors ${
                    isToday ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className={`text-sm font-semibold mb-1 ${isToday ? 'text-[#1D79C4]' : 'text-[#000000]'}`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map(apt => (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          openModal(apt);
                        }}
                        className={`text-xs p-1 rounded border ${getStatusColor(apt.status)} truncate`}
                      >
                        {new Date(apt.appointmentDate).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })} - {apt.clientName}
                      </div>
                    ))}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{dayAppointments.length - 3} más
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1f2937] uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1f2937] uppercase tracking-wider">Fecha y Hora</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1f2937] uppercase tracking-wider">Sucursal</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1f2937] uppercase tracking-wider">Estado</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-[#1f2937] uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map(apt => (
                <tr key={apt.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-semibold text-[#000000]">{apt.clientName}</div>
                        <div className="text-xs text-[#1f2937]">{apt.clientPhone}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-[#000000]">
                      {new Date(apt.appointmentDate).toLocaleDateString('es-DO')}
                    </div>
                    <div className="text-xs text-[#1f2937]">
                      {new Date(apt.appointmentDate).toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-[#1f2937]">
                    {apt.branch?.name || 'No especificada'}
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={apt.status}
                      onChange={(e) => handleStatusChange(apt, e.target.value)}
                      className={`text-xs px-2 py-1 rounded border ${getStatusColor(apt.status)}`}
                    >
                      <option value="PENDING">Pendiente</option>
                      <option value="CONFIRMED">Confirmada</option>
                      <option value="CANCELLED">Cancelada</option>
                      <option value="COMPLETED">Completada</option>
                    </select>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => openModal(apt)}
                      className="text-[#1D79C4] hover:text-[#1565b0] text-xs font-medium mr-3"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(apt)}
                      className="text-red-600 hover:text-red-700 text-xs font-medium"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-lg font-bold text-[#000000] mb-4">
                {editingAppointment ? 'Editar Cita' : 'Nueva Cita'}
              </h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#1f2937] mb-1.5">Nombre *</label>
                    <input
                      type="text"
                      value={form.clientName}
                      onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1D79C4] focus:border-[#1D79C4]"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[#1f2937] mb-1.5">Teléfono *</label>
                    <input
                      type="tel"
                      value={form.clientPhone}
                      onChange={(e) => setForm({ ...form, clientPhone: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1D79C4] focus:border-[#1D79C4]"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1f2937] mb-1.5">Email</label>
                  <input
                    type="email"
                    value={form.clientEmail}
                    onChange={(e) => setForm({ ...form, clientEmail: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1D79C4] focus:border-[#1D79C4]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1f2937] mb-1.5">Fecha y Hora *</label>
                  <input
                    type="datetime-local"
                    value={form.appointmentDate}
                    onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1D79C4] focus:border-[#1D79C4]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#1f2937] mb-1.5">Notas</label>
                  <textarea
                    value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-1 focus:ring-[#1D79C4] focus:border-[#1D79C4]"
                    rows={3}
                  />
                </div>
                <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 mt-6">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false);
                      setEditingAppointment(null);
                      resetForm();
                    }}
                    className="px-4 py-2 text-sm font-medium text-[#1f2937] hover:bg-gray-50 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium bg-[#1D79C4] text-white rounded-lg hover:bg-[#1565b0] transition-colors"
                  >
                    {editingAppointment ? 'Guardar Cambios' : 'Crear Cita'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointments;
