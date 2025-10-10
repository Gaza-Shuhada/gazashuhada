# Sources of these CSV files

[Data and text from Tech4Palestine](https://data.techforpalestine.org/docs/killed-in-gaza/)

This list incorporates the following releases from the Ministry of Health:

- The first was as of January 5th, 2024 for hospitals reporting in the South and November 2nd 2023 for the North. Additionally, 21 records were included from an earlier release as [noted in our Feburary update](https://data.techforpalestine.org/updates/killed-in-gaza-update-1/#notable-changes). ([CSV](https://github.com/TechForPalestine/palestine-datasets/blob/389c0b4db80d8765039579f06f40b434efb129c8/scripts/data/common/killed-in-gaza/data/raw.csv) / [JSON](https://github.com/TechForPalestine/palestine-datasets/blob/389c0b4db80d8765039579f06f40b434efb129c8/killed-in-gaza.json))

- The second was as of March 29th, 2024 and it included submissions from the public to the Ministry (ie: families of those killed). We detailed the changes in our [April 29th update](https://data.techforpalestine.org/updates/killed-in-gaza-update-2/). ([CSV](https://github.com/TechForPalestine/palestine-datasets/blob/408b08baea1446d75d41e4d1e9fd2f7493d5b4a7/scripts/data/common/killed-in-gaza/data/raw.csv) / [JSON](https://github.com/TechForPalestine/palestine-datasets/blob/408b08baea1446d75d41e4d1e9fd2f7493d5b4a7/killed-in-gaza.json))

- The third was as of April 30th, 2024 and released on May 5th from the Ministry. We detailed the changes in our [June 26th update](https://data.techforpalestine.org/updates/killed-in-gaza-update-3/). ([CSV](https://github.com/TechForPalestine/palestine-datasets/blob/57ca16478b6ea15502a2366bb70584f9f0db85c3/scripts/data/common/killed-in-gaza/data/raw.csv) / [JSON](https://github.com/TechForPalestine/palestine-datasets/blob/57ca16478b6ea15502a2366bb70584f9f0db85c3/killed-in-gaza.json))

- The fourth was as of June 30th, 2024 and released on July 24th from the Ministry. We detailed the changes in our [September 7th update](https://data.techforpalestine.org/updates/killed-in-gaza-update-4/). ([CSV](https://github.com/TechForPalestine/palestine-datasets/blob/9f7e93dbff3aa5101c37be40b69045d5ce77d410/scripts/data/common/killed-in-gaza/data/raw.csv) / [JSON](https://github.com/TechForPalestine/palestine-datasets/blob/9f7e93dbff3aa5101c37be40b69045d5ce77d410/killed-in-gaza.json))

- The fifth was as of August 31st, 2024 and released around September 15th by the Ministry. We detailed the changes in our [September 21st update](https://data.techforpalestine.org/updates/killed-in-gaza-update-5/). ([CSV](https://github.com/TechForPalestine/palestine-datasets/blob/8ef255407d7cb9d77a8d5e70094c29c6ccebbace/scripts/data/common/killed-in-gaza/data/raw.csv) / [JSON](https://github.com/TechForPalestine/palestine-datasets/blob/8ef255407d7cb9d77a8d5e70094c29c6ccebbace/killed-in-gaza.json))

- The sixth was as of March 23rd, 2025, and released on the same day by the Ministry via Iraq Body Count. We detailed the changes in our [May 11th update](https://data.techforpalestine.org/updates/killed-in-gaza-update-6/). ([CSV](https://github.com/TechForPalestine/palestine-datasets/blob/9f628a0b779fba1b4b87ce5f50925accdad24494/scripts/data/common/killed-in-gaza/data/raw.csv) / [JSON](https://github.com/TechForPalestine/palestine-datasets/blob/9f628a0b779fba1b4b87ce5f50925accdad24494/killed-in-gaza.json))

- The seventh was as of June 15th, 2025, and released on June 23rd from the Ministry via Iraq Body Count. We detailed the changes in our [July 6th update](https://data.techforpalestine.org/updates/killed-in-gaza-update-2025-06-15/). ([CSV](https://github.com/TechForPalestine/palestine-datasets/blob/b936c35ff3556d31df0833815456b9820b4882c8/scripts/data/common/killed-in-gaza/data/raw.csv) / [JSON](https://github.com/TechForPalestine/palestine-datasets/blob/b936c35ff3556d31df0833815456b9820b4882c8/killed-in-gaza.json))

- The eighth was as of July 15th, 2025, and released on July 16th from the Ministry via Iraq Body Count. We detailed the changes in our [July 20th update](https://data.techforpalestine.org/updates/killed-in-gaza-update-2025-07-15/). ([CSV](https://github.com/TechForPalestine/palestine-datasets/blob/4e95d05d79fffe232d7e551a89e3913199addf46/scripts/data/common/killed-in-gaza/data/raw.csv) / [JSON](https://github.com/TechForPalestine/palestine-datasets/blob/4e95d05d79fffe232d7e551a89e3913199addf46/killed-in-gaza.json))

- The ninth was as of July 31st, 2025, and released on August 4th from the Ministry via Iraq Body Count. We detailed the changes in our [August 17th update](https://data.techforpalestine.org/updates/killed-in-gaza-update-2025-08-17/). ([CSV](https://github.com/TechForPalestine/palestine-datasets/blob/68a207a49227514b0822f8816add4415718ec172/scripts/data/common/killed-in-gaza/data/raw.csv) / [JSON](https://github.com/TechForPalestine/palestine-datasets/blob/68a207a49227514b0822f8816add4415718ec172/killed-in-gaza.json))

---

## Data Cleaning - Edited Files

Some CSV files contained records with invalid external IDs that did not comply with our validation rules (IDs must contain only letters, numbers, hyphens, and underscores: `A-Za-z0-9_-`).

**Edited files have been created with the `_edited` suffix, with invalid records removed:**

### MoH-2024-04-30_edited.csv
- **Original records:** 24,671 (excluding header)
- **Removed:** 3 records
- **Final records:** 24,669
- **Issues found:**
  - Row 22737: ID `"4022 65250"` - contained space
  - Row 22780: ID `". 912041852"` - contained dot and space  
  - Row 23139: ID `"803752096  ك"` - contained trailing Arabic character

### MoH-2024-06-30_edited.csv
- **Original records:** 28,184 (excluding header)
- **Removed:** 12 records
- **Final records:** 28,173
- **Issues found:**
  - 11 records with Arabic text IDs (e.g., `"طفل رضيع"` meaning "infant baby")
  - 1 record with scientific notation: `"2.63032E+13"` (Excel formatting corruption)

### MoH-2024-08-31_edited.csv
- **Original records:** 34,343 (excluding header)
- **Removed:** 37 records
- **Final records:** 34,307
- **Issues found:**
  - 32 records with Arabic text IDs (e.g., `"طفل رضيع"`, `"طفل رضيع 112"` with spaces)
  - 4 records with garbage/corrupted IDs (e.g., `"ططفل"`, `"طفااااال"`, `"طفللللل"`)
  - 1 record with scientific notation: `"2.63032E+13"` (Excel formatting corruption)
  - 3 records with trailing spaces and Arabic characters

**Note:** The 2025 files (March, June, July) and earlier 2024 files (January, March) had no validation issues and did not require editing.

**Use the `_edited` versions for bulk uploads** to ensure all records pass validation.