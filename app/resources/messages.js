/**
 * Created by Jeremy on 12/15/2016.
 */
module.exports = {
    errors: {
        fail_generic: 'Forgive me, master. I cannot do that at this time.',
        fail_no_channel: 'Forgive me, master. I cannot seem to find you. Are you in a Voice Channel?',
        fail_different_channel: 'Forgive me, master. I am not currently in a Voice Channel with you.',
        fail_bad_url: 'Forgive me, master. I could not find any information on that.',
        fail_no_results: 'Forgive me, master. I could not find any information on that.',
        fail_too_large: 'Forgive me, master. That is too much for me to handle.',
        fail_volume_out_of_range: 'Forgive me, master. I can only accept numbers from 1 to 100.',
        fail_queue_out_of_range: 'Forgive me, master. That value is out of range.'
    },

    help: 'I hope I can be of help to you, master.\n```' +
    '>help - I will display this menu\n' +
    '>join - I will join you in a Voice Channel\n' +
    '>leave - I will leave your Voice Channel\n' +
    '>play [youtube url] - I will play the youtube video\n' +
    '>play [mp3 url] - I will play the mp3 file\n' +
    '>play [search terms] - I will search youtube for a video\n' +
    '>vol [volume] - I will adjust the volume (1 to 100)\n' +
    '>int [min] [max] - I will give you a random integer in the range\n' +
    '>dec [min] [max] - I will give you a random decimal in the range```',

    join: 'Yes, master. I will join. I am honored.',
    leave: 'Yes, master. I will leave. Thank you for having me.',
    play: {
        now: 'Yes, master. I will play that now.',
        queue: 'Yes, master. I will add that to the queue. `#%s`'
    },
    volume: 'Yes, master. I have adjusted the volume to better suit your needs. `%s%`',
    queue: 'Yes, master. Here is what I have scheduled.\n%s',
    report: {
        currently_playing: {
            exists: 'Currently playing: %s\n',
            empty: 'Nothing currently playing\n'
        },
        queued: {
            entry: '#%s %s\n',
            empty: 'Nothing is currently queued\n'
        }
    },
    remove: 'Yes, master. I have removed that from the queue.',
    gambling: {
        not_correct_format: 'Forgive me, master. That is not a valid range.',
        not_a_number: 'Forgive me, master. I require two numbers.',
        min_max_invalid: 'Forgive me, master. The minimum value must be strictly less than the maximum.',
        number: 'Yes, master. Your number is `%s`.'
    }
};