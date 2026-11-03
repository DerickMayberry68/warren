alter table public.bookings drop constraint booking_dates;
alter table public.bookings add constraint booking_dates check (
  (kind='field' and start_at is not null and end_at is not null and end_at>start_at and start_day is null and end_day is null)
  or (kind='shop' and start_day is not null and end_day is not null and end_day>=start_day and start_at is null and end_at is null)
);
