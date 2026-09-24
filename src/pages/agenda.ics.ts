import type { APIRoute } from 'astro';
import { site } from '@/config/site';
import { agenda } from '@/data/agenda';
import { AGENDA_CATEGORIES } from '@/lib/agenda';
import { buildCalendar } from '@/lib/ics';
import { withBase } from '@/lib/url';

/** Calendrier abonnable : /agenda.ics, régénéré à chaque déploiement. */
export const GET: APIRoute = ({ site: siteUrl }) => {
  const agendaUrl = siteUrl ? new URL(withBase('/agenda/'), siteUrl).href : undefined;

  const body = buildCalendar(
    agenda.map((event) => ({
      uid: event.id,
      date: event.date,
      endDate: event.endDate,
      start: event.start,
      end: event.end,
      summary: `${event.title} (${site.name})`,
      location: event.place,
      description: [event.details, AGENDA_CATEGORIES[event.category].description].filter(Boolean).join('\n\n'),
      categories: [AGENDA_CATEGORIES[event.category].label],
      url: agendaUrl,
    })),
    {
      name: site.name,
      productId: `-//${site.shortName}//Agenda//FR`,
      uidDomain: 'gic-des-bories',
      stamp: new Date(),
    },
  );

  return new Response(body, {
    headers: { 'Content-Type': 'text/calendar; charset=utf-8' },
  });
};
