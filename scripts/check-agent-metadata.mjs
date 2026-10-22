import { access, readFile } from 'node:fs/promises';
import { dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const at = (...parts) => resolve(root, ...parts);

function fail(message) {
    throw new Error(`xqtime agent metadata: ${message}`);
}

function isInsideRoot(path) {
    const relativePath = relative(root, path);
    return relativePath !== '' && !relativePath.startsWith('..') && !isAbsolute(relativePath);
}

function isPackaged(file, files) {
    return files.some((entry) => {
        const normalized = entry.replace(/^\.\//, '').replaceAll('\\', '/');
        return file === normalized || file.startsWith(`${normalized}/`);
    });
}

async function validateMetadataTarget(pkg, target) {
    if (pkg.llms !== target) {
        fail(`package.json "llms" must be "${target}".`);
    }
    if (!target.startsWith('./')) {
        fail('package.json "llms" must use a package-relative ./ path.');
    }

    const absoluteTarget = at(target.slice(2));
    if (!isInsideRoot(absoluteTarget)) {
        fail('package.json "llms" escapes the package root.');
    }
    await access(absoluteTarget);

    if (!Array.isArray(pkg.files) || !isPackaged(target.slice(2), pkg.files)) {
        fail(`"${target}" is not covered by the package files whitelist.`);
    }

    return absoluteTarget;
}

export async function checkAgentMetadata() {
    const pkg = JSON.parse(await readFile(at('package.json'), 'utf8'));
    const llmsPath = await validateMetadataTarget(pkg, './llms.txt');
    const llmsText = await readFile(llmsPath, 'utf8');

    for (const expected of [
        '# xqtime',
        "from 'xqtime'",
        'friend(time?: TimeInput',
        'TimeInput',
        'TypeError',
        'append',
        '亿年前',
    ]) {
        if (!llmsText.includes(expected)) {
            fail(`llms.txt is missing required API text "${expected}".`);
        }
    }
    if (/\b(?:TODO|FIXME|placeholder)\b/i.test(llmsText)) {
        fail('llms.txt contains a TODO, FIXME, or placeholder.');
    }

    return pkg;
}

const entry = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (entry === import.meta.url) {
    await checkAgentMetadata();
    console.log('xqtime: agent metadata check passed.');
}
