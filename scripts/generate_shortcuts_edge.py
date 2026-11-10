import asyncio
import os
import sys
import edge_tts

out_dir = os.path.abspath(os.path.join(os.getcwd(), 'public', 'audio', 'shortcuts'))
os.makedirs(out_dir, exist_ok=True)

phrases = [
    # 1. 经典12条牌桌快捷短语 (经典男声)
    {"file": "shortcut_1.mp3", "text": "快点吧，我等得花儿都谢了！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_2.mp3", "text": "怎么又断线了，网络太差了吧！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_3.mp3", "text": "你的牌打得太好了！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_4.mp3", "text": "别高兴得太早，风水轮流转！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_5.mp3", "text": "和你合作真是太愉快了！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_6.mp3", "text": "大家好，很高兴见到各位！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_7.mp3", "text": "投降输一半，要不要投降？", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_8.mp3", "text": "别吵了，专心打牌！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_9.mp3", "text": "留得青山在，不怕没柴烧！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_10.mp3", "text": "今日手气真背，一把好牌都没有！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_11.mp3", "text": "承让承让，这把承让了！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},
    {"file": "shortcut_12.mp3", "text": "看来今天我是牌神附体了！", "voice": "zh-CN-YunxiNeural", "pitch": "+0Hz", "rate": "+2%"},

    # 2. 老者音 (6条) - 纯正微软 Yunyang 沉稳老者男声
    {"file": "elder_1.mp3", "text": "老夫纵横牌坛数十年，尔等嫩了点！", "voice": "zh-CN-YunyangNeural", "pitch": "-6Hz", "rate": "-6%"},
    {"file": "elder_2.mp3", "text": "后生仔，出牌稳着点，莫急着交学费！", "voice": "zh-CN-YunyangNeural", "pitch": "-6Hz", "rate": "-6%"},
    {"file": "elder_3.mp3", "text": "老夫这一手绝牌，谁敢接招？", "voice": "zh-CN-YunyangNeural", "pitch": "-6Hz", "rate": "-6%"},
    {"file": "elder_4.mp3", "text": "茶水都凉透啦，老夫等到瞌睡都来喽！", "voice": "zh-CN-YunyangNeural", "pitch": "-6Hz", "rate": "-6%"},
    {"file": "elder_5.mp3", "text": "莫慌莫慌，牌局如人生，笑到最后才是赢家！", "voice": "zh-CN-YunyangNeural", "pitch": "-6Hz", "rate": "-6%"},
    {"file": "elder_6.mp3", "text": "承让承让，老夫这把权当倚老卖老啦！", "voice": "zh-CN-YunyangNeural", "pitch": "-6Hz", "rate": "-6%"},

    # 3. 大叔音 (6条) - 纯正微软 Yunjian 豪爽威严大叔男声
    {"file": "uncle_1.mp3", "text": "就这水平？我看阁下今日是要输精光！", "voice": "zh-CN-YunjianNeural", "pitch": "-3Hz", "rate": "+0%"},
    {"file": "uncle_2.mp3", "text": "牌风如剑，有本事放马过来！", "voice": "zh-CN-YunjianNeural", "pitch": "-3Hz", "rate": "+0%"},
    {"file": "uncle_3.mp3", "text": "牌桌无情，今天谁退缩谁是孙子！", "voice": "zh-CN-YunjianNeural", "pitch": "-3Hz", "rate": "+0%"},
    {"file": "uncle_4.mp3", "text": "看我绝大连出，谁能顶得住！", "voice": "zh-CN-YunjianNeural", "pitch": "-3Hz", "rate": "+0%"},
    {"file": "uncle_5.mp3", "text": "哈哈，承让！这把筹码爷爷我笑纳了！", "voice": "zh-CN-YunjianNeural", "pitch": "-3Hz", "rate": "+0%"},
    {"file": "uncle_6.mp3", "text": "打牌别装深沉，有大牌赶紧亮！", "voice": "zh-CN-YunjianNeural", "pitch": "-3Hz", "rate": "+0%"},

    # 4. 下战帖叫阵 (6条) - 纯正微软 Yunjian 霸气阳刚豪杰男声
    {"file": "challenge_1.mp3", "text": "谁敢和我血战到底！有本事的出来对阵！", "voice": "zh-CN-YunjianNeural", "pitch": "+0Hz", "rate": "+5%"},
    {"file": "challenge_2.mp3", "text": "摆下英雄擂台！速来战个痛快！", "voice": "zh-CN-YunjianNeural", "pitch": "+0Hz", "rate": "+5%"},
    {"file": "challenge_3.mp3", "text": "牌桌见真章！今天谁退缩谁是孙子！", "voice": "zh-CN-YunjianNeural", "pitch": "+0Hz", "rate": "+5%"},
    {"file": "challenge_4.mp3", "text": "战帖已发！谁敢放马过来接我几招？", "voice": "zh-CN-YunjianNeural", "pitch": "+0Hz", "rate": "+5%"},
    {"file": "challenge_5.mp3", "text": "先礼后兵，看我这把杀翻全场！", "voice": "zh-CN-YunjianNeural", "pitch": "+0Hz", "rate": "+5%"},
    {"file": "challenge_6.mp3", "text": "抱拳领教，全堂高手速速应战！", "voice": "zh-CN-YunjianNeural", "pitch": "+0Hz", "rate": "+5%"},

    # 5. 童音 (6条) - 纯正微软 Yunxia 调皮童声
    {"file": "kid_1.mp3", "text": "一动不动是乌龟！出牌快点啦！", "voice": "zh-CN-YunxiaNeural", "pitch": "+0Hz", "rate": "+8%"},
    {"file": "kid_2.mp3", "text": "你们打牌真慢，我等得花儿都谢了！", "voice": "zh-CN-YunxiaNeural", "pitch": "+0Hz", "rate": "+8%"},
    {"file": "kid_3.mp3", "text": "略略略，这把筹码被我全赢光啦！", "voice": "zh-CN-YunxiaNeural", "pitch": "+0Hz", "rate": "+8%"},
    {"file": "kid_4.mp3", "text": "大叔大婶，有本事放马过来呀！", "voice": "zh-CN-YunxiaNeural", "pitch": "+0Hz", "rate": "+8%"},
    {"file": "kid_5.mp3", "text": "看我这一手无敌好牌，打得你们落花流水！", "voice": "zh-CN-YunxiaNeural", "pitch": "+0Hz", "rate": "+8%"},
    {"file": "kid_6.mp3", "text": "输啦输啦，不许赖皮，快快交出筹码！", "voice": "zh-CN-YunxiaNeural", "pitch": "+0Hz", "rate": "+8%"},

    # 6. 少女音 (6条) - 纯正微软 Xiaoxiao 娇俏少女女声
    {"file": "maiden_1.mp3", "text": "谁敢和我血战到底呀？不许偷看我的牌哦！", "voice": "zh-CN-XiaoxiaoNeural", "pitch": "+2Hz", "rate": "+2%"},
    {"file": "maiden_2.mp3", "text": "客官您打牌像绣花，人家茶水都凉透啦~", "voice": "zh-CN-XiaoxiaoNeural", "pitch": "+2Hz", "rate": "+2%"},
    {"file": "maiden_3.mp3", "text": "承让承让，人家这把只是运气好嘛！", "voice": "zh-CN-XiaoxiaoNeural", "pitch": "+2Hz", "rate": "+2%"},
    {"file": "maiden_4.mp3", "text": "牌风如剑，小女子随时恭候各位过招！", "voice": "zh-CN-XiaoxiaoNeural", "pitch": "+2Hz", "rate": "+2%"},
    {"file": "maiden_5.mp3", "text": "这把筹码人家就笑纳啦，多谢各位牌友~", "voice": "zh-CN-XiaoxiaoNeural", "pitch": "+2Hz", "rate": "+2%"},
    {"file": "maiden_6.mp3", "text": "哼，人家牌风正旺，神仙也挡不住我！", "voice": "zh-CN-XiaoxiaoNeural", "pitch": "+2Hz", "rate": "+2%"},

    # 7. 萝莉音 (6条) - 纯正微软 Xiaoyi 软萌二次元萝莉女声
    {"file": "loli_1.mp3", "text": "哥哥姐姐出牌快一点嘛~ 萝莉等不及啦！", "voice": "zh-CN-XiaoyiNeural", "pitch": "+8Hz", "rate": "+10%"},
    {"file": "loli_2.mp3", "text": "看我绝大连出！谁能顶得住呀！", "voice": "zh-CN-XiaoyiNeural", "pitch": "+8Hz", "rate": "+10%"},
    {"file": "loli_3.mp3", "text": "哼，打牌不许欺负人，不然我不理你们啦！", "voice": "zh-CN-XiaoyiNeural", "pitch": "+8Hz", "rate": "+10%"},
    {"file": "loli_4.mp3", "text": "笨蛋笨蛋，看萝莉这把全盘通关！", "voice": "zh-CN-XiaoyiNeural", "pitch": "+8Hz", "rate": "+10%"},
    {"file": "loli_5.mp3", "text": "超厉害对不对！把筹码统统抱回家~", "voice": "zh-CN-XiaoyiNeural", "pitch": "+8Hz", "rate": "+10%"},
    {"file": "loli_6.mp3", "text": "哇！摸到超级神牌啦！", "voice": "zh-CN-XiaoyiNeural", "pitch": "+8Hz", "rate": "+10%"},
]

async def generate():
    print(f"🎵 开始使用微软 Neural 高品质引擎全量生成 {len(phrases)} 个离线短语 MP3...")
    success_count = 0

    for i, item in enumerate(phrases):
        target_file = os.path.join(out_dir, item["file"])
        communicate = edge_tts.Communicate(
            text=item["text"],
            voice=item["voice"],
            pitch=item["pitch"],
            rate=item["rate"]
        )
        try:
            await communicate.save(target_file)
            size = os.path.getsize(target_file)
            role_desc = "🧔/👴 真实男声" if "Yun" in item["voice"] else "👧/🎀 真实女声"
            print(f"✅ [{i+1}/{len(phrases)}] [{role_desc}] {item['file']} ({size} B, {item['voice']}) -> \"{item['text']}\"")
            success_count += 1
        except Exception as e:
            print(f"❌ [{i+1}/{len(phrases)}] 生成失败 {item['file']}: {e}")

    print(f"\n🎉 神经网络离线 MP3 声音全量就绪！成功处理 {success_count}/{len(phrases)} 个文件。大叔/老者已全部配置为微软专业男声音效！")

if __name__ == '__main__':
    asyncio.run(generate())
