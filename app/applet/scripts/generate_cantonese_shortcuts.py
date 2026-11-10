import asyncio
import os
import edge_tts

# Cantonese Voice mappings
# Male: zh-HK-WanLungNeural
# Female: zh-HK-HiuMaanNeural

phrases = [
    # 粤语男声 (6条)
    ("cantonese_m_1.mp3", "zh-HK-WanLungNeural", "快啲啦，我等到花都謝喇！"),
    ("cantonese_m_2.mp3", "zh-HK-WanLungNeural", "呢把牌咁正，呢鋪籌碼我笑納喇！"),
    ("cantonese_m_3.mp3", "zh-HK-WanLungNeural", "風水輪流轉，陣間睇我點贏返！"),
    ("cantonese_m_4.mp3", "zh-HK-WanLungNeural", "牌風如劍，有本事放馬過嚟！"),
    ("cantonese_m_5.mp3", "zh-HK-WanLungNeural", "輸少當贏，你要唔要投降啊？"),
    ("cantonese_m_6.mp3", "zh-HK-WanLungNeural", "飲杯茶，食個包，專心打牌啦！"),

    # 粤语女声 (6条)
    ("cantonese_f_1.mp3", "zh-HK-HiuMaanNeural", "各位大佬，出牌快少少啦~"),
    ("cantonese_f_2.mp3", "zh-HK-HiuMaanNeural", "承讓承讓，人家呢把只係運氣好咋！"),
    ("cantonese_f_3.mp3", "zh-HK-HiuMaanNeural", "哼，我呢排手氣正旺，神仙都擋唔住！"),
    ("cantonese_f_4.mp3", "zh-HK-HiuMaanNeural", "打牌唔許欺負人，唔係我唔理你哋喇！"),
    ("cantonese_f_5.mp3", "zh-HK-HiuMaanNeural", "哇！摸到超級神牌喇，多謝各位牌友！"),
    ("cantonese_f_6.mp3", "zh-HK-HiuMaanNeural", "呢把籌碼我攞走喇，多謝各位承讓！"),
]

output_dir = os.path.abspath("public/audio/shortcuts")

async def generate_all():
    os.makedirs(output_dir, exist_ok=True)
    print(f"Generating {len(phrases)} Cantonese offline MP3 files in {output_dir}...")
    for filename, voice, text in phrases:
        out_path = os.path.join(output_dir, filename)
        communicate = edge_tts.Communicate(text, voice)
        await communicate.save(out_path)
        size = os.path.getsize(out_path)
        print(f"✅ Generated {filename} ({size} bytes) with voice {voice}: '{text}'")

if __name__ == "__main__":
    asyncio.run(generate_all())
