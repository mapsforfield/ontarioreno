import { CalendarDays, Clock, MapPin, UserRound } from 'lucide-react';
import { usePortalAuth } from '../auth';
import { formatCurrency, formatDealStatus } from '../data/selectors';
import { usePortalData } from '../data/store';
import { Appointment, AppointmentStatus, AppointmentType } from '../data/types';

function formatAppointmentType(type: AppointmentType) {
  if (type === 'home_visit') return 'Home Visit';
  if (type === 'phone_consultation') return 'Phone Consultation';

  return 'Video Consultation';
}

function formatAppointmentStatus(status: AppointmentStatus) {
  if (status === 'no_show') return 'No Show';

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatAppointmentDate(date: string) {
  if (!date) return 'Date not set';

  return new Intl.DateTimeFormat('en-CA', {
    dateStyle: 'medium',
  }).format(new Date(`${date}T00:00:00`));
}

function isToday(date: string) {
  const today = new Date().toISOString().slice(0, 10);
  return date === today;
}

function isUpcoming(appointment: Appointment) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    appointment.appointmentDate >= today &&
    ['rescheduled', 'scheduled'].includes(appointment.status)
  );
}

function AppointmentCard({
  appointment,
  dealLabel,
  repName,
}: {
  appointment: Appointment;
  dealLabel: string;
  repName: string;
}) {
  return (
    <article className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h3 className="text-lg font-black text-slate-950">{dealLabel}</h3>
          <p className="mt-1 text-sm font-semibold text-slate-500">
            {formatAppointmentType(appointment.appointmentType)}
          </p>
        </div>
        <span className="w-fit rounded-full bg-[#e8f1fb] px-3 py-1 text-xs font-black text-[#1B3C6C]">
          {formatAppointmentStatus(appointment.status)}
        </span>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <CalendarDays className="h-4 w-4 text-[#32639b]" />
          {formatAppointmentDate(appointment.appointmentDate)}
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <Clock className="h-4 w-4 text-[#32639b]" />
          {appointment.appointmentTime || 'Time not set'}
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <UserRound className="h-4 w-4 text-[#32639b]" />
          {repName}
        </div>
        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
          <MapPin className="h-4 w-4 text-[#32639b]" />
          {appointment.location || 'Location not set'}
        </div>
      </div>
      {appointment.notes && (
        <p className="mt-4 rounded-[0.5rem] border border-slate-200 bg-white p-3 text-sm font-semibold text-slate-600">
          {appointment.notes}
        </p>
      )}
    </article>
  );
}

export default function PortalAppointments() {
  const { currentUser, isAdmin } = usePortalAuth();
  const { deals, getVisibleAppointmentsForUser, users } = usePortalData();

  if (!currentUser) return null;

  const visibleAppointments = getVisibleAppointmentsForUser(currentUser).sort(
    (first, second) =>
      `${first.appointmentDate}T${first.appointmentTime}`.localeCompare(
        `${second.appointmentDate}T${second.appointmentTime}`
      )
  );
  const todayAppointments = visibleAppointments.filter((appointment) =>
    isToday(appointment.appointmentDate)
  );
  const upcomingAppointments = visibleAppointments.filter(isUpcoming);
  const completedAppointments = visibleAppointments.filter(
    (appointment) => appointment.status === 'completed'
  );
  const reps = users.filter((user) => user.role === 'rep');

  const getDeal = (dealId: string) => deals.find((deal) => deal.id === dealId);
  const getDealLabel = (appointment: Appointment) => {
    const deal = getDeal(appointment.dealId);
    if (!deal) return 'Deal not found';

    return `${deal.homeownerName} / ${deal.projectType}`;
  };
  const getRepName = (repId: string) =>
    users.find((user) => user.id === repId)?.name ?? repId;

  const metrics = [
    {
      label: "Today's Appointments",
      value: todayAppointments.length,
      detail: 'Scheduled for today',
    },
    {
      label: 'Upcoming Appointments',
      value: upcomingAppointments.length,
      detail: 'Scheduled or rescheduled',
    },
    {
      label: 'Completed Appointments',
      value: completedAppointments.length,
      detail: 'Consultations completed',
    },
    {
      label: 'No-Shows',
      value: visibleAppointments.filter(
        (appointment) => appointment.status === 'no_show'
      ).length,
      detail: 'Performance prep',
    },
  ];

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">
          Appointment Center
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">
          Consultation schedule
        </h1>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <article
            key={metric.label}
            className="rounded-[0.5rem] border border-white bg-white p-5 shadow-sm"
          >
            <p className="text-sm font-semibold text-slate-500">
              {metric.label}
            </p>
            <p className="mt-3 text-3xl font-black tracking-[-0.02em]">
              {metric.value}
            </p>
            <p className="mt-4 text-sm font-medium text-slate-500">
              {metric.detail}
            </p>
          </article>
        ))}
      </section>

      {isAdmin && (
        <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
          <div className="border-b border-slate-200 pb-4">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
              By Rep
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
              Appointment performance prep
            </h2>
          </div>
          <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {reps.map((rep) => {
              const repAppointments = visibleAppointments.filter(
                (appointment) => appointment.assignedRepId === rep.id
              );
              const completed = repAppointments.filter(
                (appointment) => appointment.status === 'completed'
              ).length;
              const assigned = repAppointments.length;
              const completedRate =
                assigned > 0 ? Math.round((completed / assigned) * 100) : 0;

              return (
                <article
                  key={rep.id}
                  className="rounded-[0.5rem] border border-slate-200 bg-[#fbfdff] p-4"
                >
                  <h3 className="text-lg font-black text-slate-950">
                    {rep.name}
                  </h3>
                  <div className="mt-4 grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Assigned
                      </p>
                      <p className="mt-1 text-xl font-black">{assigned}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Completed
                      </p>
                      <p className="mt-1 text-xl font-black">{completed}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        No-Shows
                      </p>
                      <p className="mt-1 text-xl font-black">
                        {
                          repAppointments.filter(
                            (appointment) => appointment.status === 'no_show'
                          ).length
                        }
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
                        Rate
                      </p>
                      <p className="mt-1 text-xl font-black">
                        {completedRate}%
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm sm:p-5">
        <div className="border-b border-slate-200 pb-4">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#32639b]">
            Schedule
          </p>
          <h2 className="mt-2 text-2xl font-black tracking-[-0.02em]">
            Upcoming and recent appointments
          </h2>
        </div>
        <div className="mt-4 space-y-3">
          {visibleAppointments.length > 0 ? (
            visibleAppointments.map((appointment) => {
              const deal = getDeal(appointment.dealId);

              return (
                <div key={appointment.id}>
                  <AppointmentCard
                    appointment={appointment}
                    dealLabel={getDealLabel(appointment)}
                    repName={getRepName(appointment.assignedRepId)}
                  />
                  {deal && (
                    <p className="mt-2 text-xs font-semibold text-slate-500">
                      Deal status: {formatDealStatus(deal.status)} / Value:{' '}
                      {formatCurrency(deal.estimatedJobValue)}
                    </p>
                  )}
                </div>
              );
            })
          ) : (
            <div className="rounded-[0.5rem] border border-dashed border-slate-300 bg-slate-50 p-6 text-center">
              <CalendarDays className="mx-auto h-8 w-8 text-slate-300" />
              <p className="mt-3 text-sm font-semibold text-slate-500">
                No appointments scheduled yet.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
