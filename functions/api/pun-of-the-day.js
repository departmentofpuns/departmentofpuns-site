const TIME_ZONE = "America/Indiana/Indianapolis";

function localDate() {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

async function findEligiblePun(db, cycleNumber) {
  return db.prepare(
    `SELECT p.pun_id
     FROM puns AS p
     WHERE p.is_active = 1
       AND EXISTS (
         SELECT 1 FROM puns_to_topics AS pt WHERE pt.pun_id = p.pun_id
       )
       AND NOT EXISTS (
         SELECT 1
         FROM daily_pun_selections AS d
         WHERE d.pun_id = p.pun_id AND d.cycle_number = ?
       )
     ORDER BY RANDOM()
     LIMIT 1`,
  ).bind(cycleNumber).first();
}

async function getSelectionForToday(db, selectionDate) {
  return db.prepare(
    `SELECT d.pun_id, d.cycle_number
     FROM daily_pun_selections AS d
     JOIN puns AS p ON p.pun_id = d.pun_id
     WHERE d.selection_date = ? AND p.is_active = 1`,
  ).bind(selectionDate).first();
}

export async function onRequestGet(context) {
  const db = context.env.PUNS_DB;
  const selectionDate = localDate();
  let selection = await getSelectionForToday(db, selectionDate);

  if (!selection) {
    // An unpublished selection is no longer suitable for today's public API.
    // Removing only today's row allows a new eligible pun to take its place.
    await db.prepare(
      "DELETE FROM daily_pun_selections WHERE selection_date = ?",
    ).bind(selectionDate).run();

    const cycleRow = await db.prepare(
      "SELECT COALESCE(MAX(cycle_number), 0) AS cycle_number FROM daily_pun_selections",
    ).first();
    let cycleNumber = Number(cycleRow?.cycle_number || 0) || 1;
    let candidate = await findEligiblePun(db, cycleNumber);

    // When every eligible pun has appeared in the current cycle, begin the next one.
    if (!candidate) {
      cycleNumber += 1;
      candidate = await findEligiblePun(db, cycleNumber);
    }
    if (!candidate) {
      return Response.json({ error: "No published puns are available yet." }, { status: 404 });
    }

    // The date is unique. If simultaneous requests arrive, one insert wins and
    // both callers then receive the same daily selection.
    await db.prepare(
      `INSERT OR IGNORE INTO daily_pun_selections
       (selection_date, pun_id, cycle_number)
       VALUES (?, ?, ?)`,
    ).bind(selectionDate, candidate.pun_id, cycleNumber).run();
    selection = await getSelectionForToday(db, selectionDate);
  }

  const pun = await db.prepare(
    `SELECT
       p.pun_id,
       s.pun_text,
       s.submitted_by,
       GROUP_CONCAT(t.topic_text, '|') AS topics
     FROM puns AS p
     JOIN submissions AS s ON s.submission_id = p.submission_id
     JOIN puns_to_topics AS pt ON pt.pun_id = p.pun_id
     JOIN topics AS t ON t.topic_id = pt.topic_id
     WHERE p.pun_id = ? AND p.is_active = 1
     GROUP BY p.pun_id, s.pun_text, s.submitted_by`,
  ).bind(selection?.pun_id).first();

  if (!pun) {
    return Response.json({ error: "No published puns are available yet." }, { status: 404 });
  }

  return Response.json({
    date: selectionDate,
    cycle: selection.cycle_number,
    pun: {
      id: pun.pun_id,
      text: pun.pun_text,
      submittedBy: pun.submitted_by || null,
      topics: pun.topics.split("|"),
    },
  }, { headers: { "Cache-Control": "no-store" } });
}
