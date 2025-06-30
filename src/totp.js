// Base32解码函数
function base32Decode(base32) {
    const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    let bits = '';
    let result = [];

    // 移除所有非Base32字符
    base32 = base32.replace(/[^A-Z2-7]/gi, '').toUpperCase();

    // 将每个字符转换为5位二进制
    for (let i = 0; i < base32.length; i++) {
        const val = base32chars.indexOf(base32.charAt(i));
        if (val === -1) continue;
        bits += val.toString(2).padStart(5, '0');
    }

    // 每8位转换为一个字节
    for (let i = 0; i + 8 <= bits.length; i += 8) {
        const chunk = bits.substr(i, 8);
        result.push(parseInt(chunk, 2));
    }

    return new Uint8Array(result);
}

// 将整数转换为字节数组
function intToBytes(num) {
    const bytes = new Uint8Array(8);
    let temp = num;

    // 大端字节序
    for (let i = 7; i >= 0; i--) {
        bytes[i] = temp & 0xff;
        temp = Math.floor(temp / 256);
    }

    return bytes;
}

// HMAC-SHA1实现
async function hmacSha1(key, message) {
    const cryptoKey = await crypto.subtle.importKey(
        'raw',
        key,
        { name: 'HMAC', hash: 'SHA-1' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        cryptoKey,
        message
    );

    return new Uint8Array(signature);
}

// 生成TOTP代码
async function generateTOTP(secret, time) {
    // 将Base32密钥转换为字节数组
    const key = base32Decode(secret);

    // 计算时间步数（30秒一个步长）
    const timeStep = Math.floor(time / 30);

    // 将时间步数转换为8字节的大端字节序
    const timeBytes = intToBytes(timeStep);

    // 计算HMAC-SHA1
    const hmacResult = await hmacSha1(key, timeBytes);

    // 获取偏移量（最后一个字节的低4位）
    const offset = hmacResult[19] & 0xf;

    // 根据偏移量提取4个字节并转换为整数
    const binCode = ((hmacResult[offset] & 0x7f) << 24) |
        ((hmacResult[offset + 1] & 0xff) << 16) |
        ((hmacResult[offset + 2] & 0xff) << 8) |
        (hmacResult[offset + 3] & 0xff);

    // 生成6位数字
    return (binCode % 1000000).toString().padStart(6, '0');
}
async function getTOTP(secret) {
    const currentTime = Math.floor(Date.now() / 1000);
    const currentCode = await generateTOTP(secret, currentTime);
    const previousCode = await generateTOTP(secret, currentTime - 30);
    const nextCode = await generateTOTP(secret, currentTime + 30);
    const countdown = 30 - (currentTime % 30);
    return { currentCode, previousCode, nextCode, countdown };
}
//otpauth://totp/MyService:alice?secret=JBSWY3DPEHPK3PXP&issuer=MyService
function addTotp(raw) {
    if (!raw) throw '无内容'
    let t=Date.now()
    const arr = raw.split('\n')
    return arr.map(v => {
        const id=++t
        let reg = /otpauth:\/\/.+/.exec(v)
        if (reg) {
            const a = new URL(reg[0])
            const name = decodeURIComponent(a.pathname.substring(1)).split(':')
            const account = name[1] || name[0]
            const secret = a.searchParams.get("secret")
            const issuer = decodeURIComponent(a.searchParams.get("issuer"))
            const otpauth = `otpauth://totp/${encodeURIComponent(account)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}`
            if(secret.length<16)throw '密钥无效:'+secret
            return { issuer, account, secret, otpauth, id }
        }
        reg = /[A-Z2-7 ]{16,}/gi.exec(v)
        if (!reg) throw '密钥无效:'+v
        const secret = reg[0].replace(/ /g, '').toUpperCase();
        const otpauth = `otpauth://totp/?secret=${secret}&issuer=`
        return { issuer:'', account:'', secret, otpauth, id }
    }).filter(Boolean)
}
function showTotp(totp) {
    return totp.issuer + '(' + totp.secret.substr(0, 3) + '***' + totp.secret.substr(-3) + ')' + totp.account;
}
export { getTOTP, addTotp, showTotp };