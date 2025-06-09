import argparse
import json
import os
from datetime import datetime

import workflow_data

MOD_FILE = 'modifications.json'


def load_mods():
    if os.path.exists(MOD_FILE):
        with open(MOD_FILE, 'r') as f:
            return json.load(f)
    return {}


def save_mods(mods):
    with open(MOD_FILE, 'w') as f:
        json.dump(mods, f, indent=2)


def get_base_schedule(week_type, day):
    week_key = 'frank_week' if week_type.lower().startswith('f') else 'lloyd_week'
    return [row.copy() for row in workflow_data.base_schedule[week_key][day]]


def apply_modifications(schedule, mods):
    reass = mods.get('reassignments', {})
    for row in schedule:
        if row['id'] in reass:
            row.update(reass[row['id']])
    return schedule


def format_schedule(schedule, callouts=None):
    lines = []
    lines.append(f"{'Assignment':<15} {'AM':<10} {'PM':<10}")
    for row in schedule:
        lines.append(f"{row['assignment']:<15} {row['AM']:<10} {row['PM']:<10}")
    if callouts:
        lines.append('\nCall Outs: ' + ', '.join(callouts))
    return '\n'.join(lines)


def handle_show(args):
    mods = load_mods().get(args.date, {})
    week_type = mods.get('week_type', args.week)
    day = datetime.fromisoformat(args.date).strftime('%A')
    schedule = get_base_schedule(week_type, day)
    schedule = apply_modifications(schedule, mods)
    text = format_schedule(schedule, mods.get('callouts'))
    print(text)
    if args.copy:
        try:
            import pyperclip
            pyperclip.copy(text)
            print('\nSchedule copied to clipboard.')
        except Exception as e:
            print(f"Failed to copy to clipboard: {e}")


def handle_callout(args):
    mods_all = load_mods()
    mods = mods_all.setdefault(args.date, {})
    mods.setdefault('callouts', [])
    if args.name not in mods['callouts']:
        mods['callouts'].append(args.name)
    mods['week_type'] = args.week
    save_mods(mods_all)
    print(f"Recorded callout for {args.name} on {args.date}")


def handle_assign(args):
    mods_all = load_mods()
    mods = mods_all.setdefault(args.date, {})
    mods.setdefault('reassignments', {})
    entry = {}
    if args.am is not None:
        entry['AM'] = args.am
    if args.pm is not None:
        entry['PM'] = args.pm
    mods['reassignments'][args.id] = entry
    mods['week_type'] = args.week
    save_mods(mods_all)
    print(f"Reassigned {args.id} on {args.date}")


def build_parser():
    parser = argparse.ArgumentParser(description='Pharmacist workflow tool')
    sub = parser.add_subparsers(dest='command')

    show_p = sub.add_parser('show', help='Show schedule for date')
    show_p.add_argument('--date', required=True, help='YYYY-MM-DD')
    show_p.add_argument('--week', default='frank', help='frank or lloyd')
    show_p.add_argument('--copy', action='store_true', help='Copy to clipboard')
    show_p.set_defaults(func=handle_show)

    call_p = sub.add_parser('callout', help='Record callout')
    call_p.add_argument('--date', required=True)
    call_p.add_argument('--week', default='frank')
    call_p.add_argument('--name', required=True)
    call_p.set_defaults(func=handle_callout)

    ass_p = sub.add_parser('assign', help='Reassign position')
    ass_p.add_argument('--date', required=True)
    ass_p.add_argument('--week', default='frank')
    ass_p.add_argument('--id', required=True, help='Row id (e.g., Line1)')
    ass_p.add_argument('--am')
    ass_p.add_argument('--pm')
    ass_p.set_defaults(func=handle_assign)

    return parser


def main():
    parser = build_parser()
    args = parser.parse_args()
    if not args.command:
        parser.print_help()
    else:
        args.func(args)


if __name__ == '__main__':
    main()
