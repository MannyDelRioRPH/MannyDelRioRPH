- 👋 Hi, I’m @MannyDelRioRPH
- 👀 I’m interested in generative AI, SQL, PowerBI
- 🌱 I’m currently learning Python and PowerApps
- 💞️ I’m looking to collaborate on VA related projects, however particularly those related to pharmacy


<!---
MannyDelRioRPH/MannyDelRioRPH is a ✨ special ✨ repository because its `README.md` (this file) appears on your GitHub profile.
You can click the Preview link to take a look at your changes.
--->

## Workflow Tool

This repository contains a small command line tool for posting the pharmacist workflow schedule in Microsoft Teams. The default weekly schedules are stored in `workflow_data.py` and you can track call outs or reassignment changes for any date.

### Setup

Install dependencies with pip:

```bash
pip install -r requirements.txt
```

### Usage

Show the schedule for a date (specify whether it is a Frank/Iraida or Lloyd/Kara week):

```bash
python workflow_tool.py show --date 2024-04-01 --week frank
```

Record a call out:

```bash
python workflow_tool.py callout --date 2024-04-01 --week frank --name Hemi
```

Reassign a position (use the id from `workflow_data.py` such as `Line1`):

```bash
python workflow_tool.py assign --date 2024-04-01 --week frank --id Line1 --am Tim
```

Use `--copy` with the `show` command to copy the schedule text to the clipboard for easy pasting into Microsoft Teams.
