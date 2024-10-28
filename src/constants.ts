const sipsForBot: {
  length: number;
  type: 'small' | 'medium' | 'large' | 'huge';
}[] = [
  {
    type: 'huge',
    length: 4,
  },
  {
    type: 'large',
    length: 3,
  },
  {
    type: 'large',
    length: 3,
  },
  {
    type: 'medium',
    length: 2,
  },
  {
    type: 'medium',
    length: 2,
  },
  {
    type: 'medium',
    length: 2,
  },
  {
    type: 'small',
    length: 1,
  },
  {
    type: 'small',
    length: 1,
  },
  {
    type: 'small',
    length: 1,
  },
  {
    type: 'small',
    length: 1,
  },
];

const BOT_NAME = 'Mr Bot';
const INPUT_MARK = '<<<<<<<      IN     <<<<<<<<<';
const OUTPUT_MARK = '>>>>>>>     OUT     >>>>>>>>';
const OUTPUT_ALL_MARK = '>>>>>>>>    ALL    >>>>>>>>';
export { sipsForBot, BOT_NAME, OUTPUT_MARK, INPUT_MARK, OUTPUT_ALL_MARK };
