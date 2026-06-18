import { CalendarClock, Check, ListTodo, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { usePortalAuth } from '../auth';
import { usePortalData } from '../data/store';
import type { Task } from '../data/types';

function formatDue(dueAt: string | null | undefined): { label: string; overdue: boolean } | null {
  if (!dueAt) return null;
  const hasTime = dueAt.includes('T');
  const date = new Date(hasTime ? dueAt : `${dueAt}T23:59:59`);
  if (isNaN(date.getTime())) return null;
  const overdue = date.getTime() < Date.now();
  const dateStr = new Date(dueAt.slice(0, 10) + 'T12:00:00').toLocaleDateString('en-CA', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timeStr = hasTime
    ? ' · ' + new Date(dueAt).toLocaleTimeString('en-CA', { hour: 'numeric', minute: '2-digit', hour12: true })
    : '';
  return { label: `${dateStr}${timeStr}`, overdue };
}

export default function PortalTasks() {
  const { currentUser } = usePortalAuth();
  const { tasks, addTask, updateTask, deleteTask } = usePortalData();
  const [title, setTitle] = useState('');
  const [due, setDue] = useState('');
  const [adding, setAdding] = useState(false);

  const myTasks = useMemo(
    () => tasks.filter((t) => t.userId === currentUser?.id),
    [tasks, currentUser?.id]
  );
  const open = useMemo(
    () =>
      myTasks
        .filter((t) => !t.done)
        .sort((a, b) => (a.dueAt ?? '9999').localeCompare(b.dueAt ?? '9999')),
    [myTasks]
  );
  const done = useMemo(() => myTasks.filter((t) => t.done), [myTasks]);

  const submit = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    setAdding(true);
    await addTask(trimmed, due || null);
    setTitle('');
    setDue('');
    setAdding(false);
  };

  const renderTask = (task: Task) => {
    const dueInfo = formatDue(task.dueAt);
    return (
      <div
        key={task.id}
        className="flex items-center gap-3 rounded-[0.5rem] border border-slate-200 bg-white px-3 py-2.5"
      >
        <button
          type="button"
          onClick={() => updateTask(task.id, { done: !task.done })}
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition ${
            task.done
              ? 'border-emerald-500 bg-emerald-500 text-white'
              : 'border-slate-300 hover:border-[#1B3C6C]'
          }`}
          aria-label={task.done ? 'Mark not done' : 'Mark done'}
        >
          {task.done && <Check className="h-3 w-3" />}
        </button>
        <div className="min-w-0 flex-1">
          <p className={`text-sm font-bold ${task.done ? 'text-slate-400 line-through' : 'text-slate-900'}`}>
            {task.title}
          </p>
          {dueInfo && !task.done && (
            <p
              className={`mt-0.5 inline-flex items-center gap-1 text-xs font-bold ${
                dueInfo.overdue ? 'text-red-500' : 'text-slate-400'
              }`}
            >
              <CalendarClock className="h-3 w-3" />
              {dueInfo.label}
              {dueInfo.overdue && ' (overdue)'}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => deleteTask(task.id)}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-slate-300 transition hover:bg-red-50 hover:text-red-500"
          aria-label="Delete task"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <header>
        <p className="text-sm font-bold uppercase tracking-[0.16em] text-[#32639b]">My To-Do</p>
        <h1 className="mt-2 text-3xl font-black tracking-[-0.02em]">Tasks</h1>
        <p className="mt-1 text-sm font-semibold text-slate-500">
          Your personal task list. You’ll get a morning email of anything due today.
        </p>
      </header>

      {/* Add task */}
      <section className="rounded-[0.5rem] border border-white bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') submit(); }}
            placeholder="Add a task — e.g. Call Audley about the quote"
            className="min-w-0 flex-1 rounded-[0.5rem] border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-[#1B3C6C]"
          />
          <input
            type="datetime-local"
            value={due}
            onChange={(e) => setDue(e.target.value)}
            className="w-full shrink-0 rounded-[0.5rem] border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-600 outline-none focus:border-[#1B3C6C] sm:w-52"
          />
          <button
            type="button"
            onClick={submit}
            disabled={adding || !title.trim()}
            className="inline-flex items-center justify-center gap-2 rounded-[0.5rem] bg-[#1B3C6C] px-5 py-2.5 text-sm font-bold text-white transition hover:bg-[#153158] disabled:opacity-50"
          >
            <Plus className="h-4 w-4" />
            Add
          </button>
        </div>
      </section>

      {/* Open tasks */}
      <section className="space-y-2.5">
        {open.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[0.5rem] border border-dashed border-slate-300 bg-white py-14 text-center">
            <ListTodo className="h-9 w-9 text-slate-300" />
            <p className="mt-3 text-sm font-bold text-slate-600">Nothing on your list</p>
            <p className="mt-1 text-xs font-medium text-slate-400">Add a task above to get started.</p>
          </div>
        ) : (
          open.map(renderTask)
        )}
      </section>

      {/* Completed */}
      {done.length > 0 && (
        <section>
          <p className="mb-2 text-xs font-black uppercase tracking-[0.12em] text-slate-400">
            Completed ({done.length})
          </p>
          <div className="space-y-2.5 opacity-70">{done.map(renderTask)}</div>
        </section>
      )}
    </div>
  );
}
