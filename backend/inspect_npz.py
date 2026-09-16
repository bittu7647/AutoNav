import json

# Check sample structure
with open('C:/Autonomous Nav/nuscenes_mini/v1.0-mini/sample.json') as f:
    samples = json.load(f)

print("Sample keys:", list(samples[0].keys()))
print("First sample:", json.dumps(samples[0], indent=2)[:500])

# Check sample_data structure
with open('C:/Autonomous Nav/nuscenes_mini/v1.0-mini/sample_data.json') as f:
    sds = json.load(f)

print("\nSample data keys:", list(sds[0].keys()))
# Find sample_data entries for the first sample
first_token = samples[0]['token']
matching = [sd for sd in sds if sd.get('sample_token') == first_token and sd.get('is_key_frame')]
print(f"\nMatching sample_data for first sample ({len(matching)}):")
for sd in matching:
    # Find sensor name
    print(f"  channel: {sd.get('channel', '?')}, file: {sd['filename'][:60]}")
