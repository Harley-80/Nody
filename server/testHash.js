import bcrypt from 'bcryptjs';

const hash = '$2b$12$NuHlxum/86kYR.3mGSYQb.E/QXN1az21GyXvRIwCugvDcddAlRGSe';
const testPasswords = [
    'Admin@2025',
    'admin123',
    'Admin123',
    '123456',
    'MotDePasse',
];

for (const pass of testPasswords) {
    const match = await bcrypt.compare(pass, hash);
    console.log(`${pass} -> ${match}`);
}
