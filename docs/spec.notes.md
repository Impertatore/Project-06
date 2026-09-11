Create a Wordle game that runs in the browser.

## Intent

The player has 6 guesses to find a hidden 5-letter word. Each guess is coloured letter by letter. The player gets 2 hints per game, and their statistics are kept in the browser between visits.

## Page layout

### Header area

- Top-Left: Title 'Wordle Practice'
- Top-Right: Buttons - Hint, Stats, New Game

### Main area

6x5 tiles where the 5 letter words will be typed in by the user

The querty keyboard visible on the screen, under the squares
example:

- `Q W E R T Y U I O P`
- `A S D F G H J K L`
- `Enter Z X C V B N M ⌫`

## Core functionality

Support only English language for now; keep it simple
A valid word is accepted, so there must be a list kept somewhere.
The correct words are selected at random when I creaet a new gam

- when I win suggest that the user is a Genius if they guess in one attempt, Magnificnt in 2 guess and make up the rest...
- when I lose, display the correct word

### Typing

- Letters can be typed on the physical keyboard or by clicking on-screen keys. Both behave the same.
- Letters show in uppercase. Only A–Z are accepted.
- The current row holds at most 5 letters. Extra letters are ignored.
- Backspace removes the last letter. On an empty row it does nothing.
- The row being typed is always the first unused row. Typed letters show only while the game is in play.
- After the game ends (won or lost), typing, Backspace, Enter and Hint do nothing until a new game starts.

### Colouring a guess

Each letter gets one of three scores:

- correct (green): right letter, right place.
- present (yellow): the letter is in the answer, in another place, and an unmatched copy is left.
- absent (grey): otherwise.

## Additional

Keep the storage in local storage on browser, persist stats
Try to keep the traditional features of a typical wordle app; there are many examples, but ask if you need more details before completing the spec.
