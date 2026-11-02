import { createFileRoute } from '@tanstack/react-router';
import { PageHero, Section } from '~/components/guide/Page';
import { useGuide } from '~/components/guide/use-guide';
import { pageHead } from '~/utils/seo';

export const Route = createFileRoute('/_guide/downloads')({
  head: ({ matches }) => pageHead(matches, '/downloads', 'Downloads'),
  component: DownloadsPage
});

function DownloadsPage() {
  const { downloads, name } = useGuide();
  return (
    <>
      <PageHero path='/downloads' title='Downloads' tone='brand' />

      <Section id='all-files' title='All files' layout='bleed'>
        <div className='sb-zip tone-ink'>
          <div>
            <p className='t-h3'>Every {name} file in one zip</p>
            <p className='t-small t-muted'>
              {downloads.fileCount} files, {downloads.zip.size}
            </p>
          </div>
          <a className='sb-button' href={downloads.zip.href} download data-download-all>
            Download all
          </a>
        </div>
      </Section>

      <Section id='by-group' title='Files by group'>
        {downloads.groups.map((group) => (
          <div key={group.name} className='sb-file-group'>
            <h3 className='t-h3'>{group.name}</h3>
            <div className='sb-scroll-x' tabIndex={0} role='region' aria-label={`${group.name} files`}>
              <table className='sb-table t-small'>
                <thead>
                  <tr className='t-label'>
                    <th scope='col'>File</th>
                    <th scope='col'>Format</th>
                    <th scope='col' style={{ textAlign: 'right' }}>
                      Size
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {group.files.map((file) => (
                    <tr key={file.key} data-zip-path={file.zipPath ?? ''}>
                      <td>
                        <a className='sb-text-link' href={file.href} download>
                          {file.label}
                        </a>
                      </td>
                      <td className='t-mono'>{file.format}</td>
                      <td className='t-mono sb-table__num' style={{ textAlign: 'right' }}>
                        {file.size}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </Section>
    </>
  );
}
