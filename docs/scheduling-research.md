# Warren scheduling research and proposed direction

Research date: November 3, 2026. Based on public vendor documentation, not hands-on trials or paid accounts. Features and plan availability can change.

Derick confirmed Warren handles a mix of shop jobs and scheduled field visits.
The agreed scope in `quotes/README.md` includes jobs, crews, dates, phone calendar
access, staff notifications, and two-way field updates. This document proposes
how to deliver that scope; it does not report an implemented scheduler or create
additional commercial commitments.

## Products reviewed

| Product | Documented strength | Proposed adaptation for Warren |
| --- | --- | --- |
| Jobber | Separates the overall job from scheduled visits; offers day/week/month schedule views, assignments, and rescheduling. | One job record with multiple bookings, so a generator installation can have a survey, installation, and return visit without duplicate customer/job records. |
| Housecall Pro | Drag-and-drop dispatching, calendar/map views, status updates, and multiple employees per job. | Quick rescheduling and multi-person assignments. Make the lead person explicit rather than relying on assignment order. |
| ServiceM8 | Staff schedule, job queues, booking history, and team scheduling. | Keep unscheduled work visible beside booked work; show who changed a booking and when. |
| Shopmonkey | Visual repair-shop workflow, customizable job cards and labels, capacity-aware scheduling. | A shop board with clear progress and blocker labels, linked to the crew calendar. |

Sources:

- [Jobber jobs and visits](https://help.getjobber.com/en/articles/jobs-in-the-jobber-app/)
- [Jobber schedule overview](https://help.getjobber.com/en/articles/schedule-overview-new-schedule/)
- [Housecall Pro dispatching](https://www.housecallpro.com/features/dispatching-software/)
- [Housecall Pro scheduling FAQ](https://help.housecallpro.com/en/articles/9483598-scheduling-and-calendar-faq)
- [ServiceM8 staff schedule](https://support.servicem8.com/help-center/desktop/basics/using-the-schedule-tab)
- [ServiceM8 jobs and scheduling](https://support.servicem8.com/help-center/topics/jobs-and-scheduling)
- [Shopmonkey workflow](https://www.shopmonkey.io/product/workflow)

## Recommended experience

### Office: calendar and shop board

Default to a week calendar with a day view grouped by assigned person/crew.
Keep an unscheduled tray beside it. Allow timed field visits and flexible
day-based shop work; do not invent exact appointment times for shop backlog.
Provide normal edit controls as well as desktop drag-and-drop.

Use a second board for job progress: New, Ready to schedule, Scheduled,
In progress, Waiting, Ready for pickup, Completed. Keep blockers such as
Waiting on parts or Customer approval separate from booking dates. Exact
labels need Warren's review before implementation.

One job can have multiple bookings and multiple assigned people. Each booking
has a lead person, duration, location (shop or field), and instructions.
Jobs can also span multiple days. Moving a booking must not duplicate the job
or erase its notes and history.

### Job card

Capture job number, customer/contact, equipment description, service type,
shop/field location, requested due date, priority, estimate of effort,
assigned crew, lead person, instructions, blocker, and progress. Add
model/serial fields when relevant to generators or equipment. Photos and
checklists are useful enhancements rather than prerequisites for basic booking.

The schedule should expose staff time off and warn about overlapping assignments.
Resource/bay capacity should be added only after Warren identifies which bays,
trucks, or machines actually constrain scheduling. Capacity rules must distinguish
tentative day-based backlog from firm timed commitments.

### Field: My day

Use a phone-friendly agenda with customer call and directions links, equipment
details, assigned teammates, instructions, and large status buttons. Staff can
update their assigned work, add notes, and mark a visit complete. Completing
one visit must not automatically close a job with further visits remaining.

Persist updates before displaying success. If connectivity fails, show that
the update has not synced. Offline editing and durable retry queues should
be scoped explicitly rather than implied by a cached page.

### Notifications and phone calendar

Notify affected staff when assignments, times, or cancellations change. Show
the previous and new booking details and a link to the job. Cancel obsolete
reminders and avoid duplicate alerts. Begin with in-portal notifications;
select and verify any email, SMS, or push channel before claiming delivery.

Provide individual, revocable, read-only calendar subscriptions with minimal
customer details. The portal remains authoritative for urgent changes and
two-way updates: calendar subscription refresh rates are controlled by the
calendar provider and are not guaranteed to be immediate.

Source for the external-calendar limitation:
[Jobber calendar syncing](https://getjobber.zendesk.com/hc/en-us/articles/115009378687-Calendar-Syncing).

## Proposed implementation sequence

1. Jobs, customer/equipment details, staff/crew assignments, bookings, shop board,
   day/week calendar, and overlap warnings.
2. My day, assigned-job permissions, field status/notes, and change history.
3. Staff notifications with delivery verification, calendar subscriptions, and
   rescheduling/cancellation/permission tests.

These are engineering increments within the complete scheduling scope, not
separately priced phases. Recurring maintenance is a useful follow-on candidate
for generator service, subject to confirming Warren's workflow.

Defer public instant booking, automated route optimization, GPS tracking,
payroll, inventory purchasing, and predictive/AI dispatch. The initial tool
should make actual shop and field work easy to organize and update.

## Decisions to confirm before implementation

- Who schedules work, and who can move other people's bookings?
- How many people and standing crews are involved?
- Which jobs use firm times versus flexible day/due-date commitments?
- Which resources constrain capacity: staff, service trucks, bays, or machines?
- Preferred notification channel and expected rural connectivity.

No application, database, or deployment changes were made for this research.
