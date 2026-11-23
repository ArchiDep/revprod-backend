import { createComment, getComments } from '../../db.js';
import { getValidationErrors } from '../validation.js';

export function sharePage(req, res) {
  res.render('share/share', {
    pageTitle: 'Share your experience'
  });
}

export async function share(req, res) {
  const errors = getValidationErrors(req.body, 'comment');
  if (errors) {
    res.redirect('/');
    return;
  }

  const { name, text } = req.body;

  await createComment({ name, text });

  req.logger.info(`New comment by ${JSON.stringify(name)}`);

  res.render('share/share', {
    pageTitle: 'Thank you!',
    shared: true
  });
}

export async function listComments(req, res) {
  const comments = await getComments();

  res.send(
    comments
      .toSorted(
        (firstComment, secondComment) =>
          secondComment.date.valueOf() - firstComment.date.valueOf()
      )
      .map(comment => commentToJson(comment))
  );
}

function commentToJson({ name, text, date }) {
  return {
    name,
    text,
    date: date.toISO()
  };
}
