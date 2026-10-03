const MAX_PUN_LENGTH = 1_000;
const MAX_NAME_LENGTH = 80;

export async function onRequestPost(context) {
  let body;

  try {
    body = await context.request.json();
  } catch {
    return Response.json({ error: "Please submit the form again." }, { status: 400 });
  }

  // A hidden field that people never see. Bots often fill every field.
  if (String(body.company || "").trim()) {
    return Response.json({ message: "Thank you for your submission." }, { status: 202 });
  }

  const punText = String(body.punText || "").trim();
  const submittedBy = String(body.submittedBy || "").trim() || null;

  if (punText.length < 3 || punText.length > MAX_PUN_LENGTH) {
    return Response.json(
      { error: `Please enter a pun between 3 and ${MAX_PUN_LENGTH} characters.` },
      { status: 400 },
    );
  }

  if (submittedBy && submittedBy.length > MAX_NAME_LENGTH) {
    return Response.json(
      { error: `A credit name can be at most ${MAX_NAME_LENGTH} characters.` },
      { status: 400 },
    );
  }

  await context.env.PUNS_DB.prepare(
    `INSERT INTO submissions (pun_text, submitted_by)
     VALUES (?, ?)`,
  ).bind(punText, submittedBy).run();

  return Response.json(
    { message: "Thank you! The Pun-dent will review your submission." },
    { status: 201 },
  );
}
